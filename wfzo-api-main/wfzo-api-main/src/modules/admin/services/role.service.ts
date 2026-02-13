import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Role, RoleDocument, Privilege, PRIVILEGE_DESCRIPTIONS } from "../schemas/role.schema";
import { RoleDto, RolesAndPrivilegesDto } from "../dto/role.dto";
import { CreateRoleDto, UpdateRoleDto } from "../dto/role-management.dto";

/**
 * RoleService - Manages roles and privileges dynamically
 * 
 * Best Practices Implemented:
 * 1. Denormalized data structure (privileges embedded in roles)
 * 2. Caching for frequently accessed data
 * 3. Type-safe privilege checking
 * 4. Dynamic role management via API (no code changes needed)
 * 5. Reusable across frontend and backend
 */
@Injectable()
export class RoleService {
  private rolesCache: Map<string, Role> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(@InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>) {
    // Initialize cache on startup
    this.refreshCache();
  }

  /**
   * Create a new role
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    // Check if role already exists
    const existing = await this.roleModel.findOne({ name: createRoleDto.name.toUpperCase() }).exec();
    if (existing) {
      throw new ConflictException(`Role with code ${createRoleDto.name} already exists`);
    }

    const role = new this.roleModel({
      name: createRoleDto.name.toUpperCase(),
      displayName: createRoleDto.displayName,
      description: createRoleDto.description,
      privileges: createRoleDto.privileges,
      priority: createRoleDto.priority ?? 0,
      isActive: createRoleDto.isActive ?? true,
    });

    const saved = await role.save();
    await this.refreshCache();

    return saved.toObject();
  }

  /**
   * Update an existing role
   */
  async updateRole(roleName: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleModel.findOne({ name: roleName.toUpperCase() }).exec();
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    // Update fields
    if (updateRoleDto.displayName !== undefined) role.displayName = updateRoleDto.displayName;
    if (updateRoleDto.description !== undefined) role.description = updateRoleDto.description;
    if (updateRoleDto.privileges !== undefined) role.privileges = updateRoleDto.privileges;
    if (updateRoleDto.priority !== undefined) role.priority = updateRoleDto.priority;
    if (updateRoleDto.isActive !== undefined) role.isActive = updateRoleDto.isActive;

    const updated = await role.save();
    await this.refreshCache();

    return updated.toObject();
  }

  /**
   * Delete a role (soft delete by setting isActive=false)
   */
  async deleteRole(roleName: string): Promise<void> {
    const role = await this.roleModel.findOne({ name: roleName.toUpperCase() }).exec();
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    // Soft delete
    role.isActive = false;
    await role.save();
    await this.refreshCache();
  }

  /**
   * Hard delete a role (use with caution)
   */
  async hardDeleteRole(roleName: string): Promise<void> {
    const result = await this.roleModel.deleteOne({ name: roleName.toUpperCase() }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }
    await this.refreshCache();
  }

  /**
   * Validate that role codes exist in the database
   * Used when assigning roles to users
   */
  async validateRoleCodes(roleCodes: string[]): Promise<void> {
    await this.ensureCache();

    const invalidRoles: string[] = [];
    for (const code of roleCodes) {
      const upperCode = code.toUpperCase();
      if (!this.rolesCache.has(upperCode)) {
        invalidRoles.push(code);
      }
    }

    if (invalidRoles.length > 0) {
      throw new BadRequestException(`Invalid role codes: ${invalidRoles.join(", ")}`);
    }
  }

  /**
   * Get all roles and privileges
   * Used by both frontend (for UI) and backend (for authorization)
   */
  async getAllRolesAndPrivileges(): Promise<RolesAndPrivilegesDto> {
    await this.ensureCache();

    const roles = Array.from(this.rolesCache.values())
      .filter((role) => role.isActive)
      .sort((a, b) => b.priority - a.priority) // Sort by priority descending
      .map((role) => this.toDto(role));

    return {
      roles,
      allPrivileges: Object.values(Privilege),
      privilegeDescriptions: PRIVILEGE_DESCRIPTIONS,
    };
  }

  /**
   * Get a single role by name
   */
  async getRoleByName(roleName: string): Promise<Role> {
    await this.ensureCache();

    const role = this.rolesCache.get(roleName.toUpperCase());
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    return role;
  }

  /**
   * Get privileges for multiple roles
   * Used when a user has multiple roles - returns union of all privileges
   */
  async getPrivilegesForRoles(roleNames: string[]): Promise<Privilege[]> {
    await this.ensureCache();

    const privilegesSet = new Set<Privilege>();

    for (const roleName of roleNames) {
      const role = this.rolesCache.get(roleName.toUpperCase());
      if (role && role.isActive) {
        role.privileges.forEach((privilege) => privilegesSet.add(privilege));
      }
    }

    return Array.from(privilegesSet);
  }

  /**
   * Check if user with given roles has a specific privilege
   */
  async hasPrivilege(roleNames: string[], privilege: Privilege): Promise<boolean> {
    const privileges = await this.getPrivilegesForRoles(roleNames);
    return privileges.includes(privilege);
  }

  /**
   * Check if user with given roles has ANY of the specified privileges
   */
  async hasAnyPrivilege(roleNames: string[], privileges: Privilege[]): Promise<boolean> {
    const userPrivileges = await this.getPrivilegesForRoles(roleNames);
    return privileges.some((privilege) => userPrivileges.includes(privilege));
  }

  /**
   * Check if user with given roles has ALL of the specified privileges
   */
  async hasAllPrivileges(roleNames: string[], privileges: Privilege[]): Promise<boolean> {
    const userPrivileges = await this.getPrivilegesForRoles(roleNames);
    return privileges.every((privilege) => userPrivileges.includes(privilege));
  }

  /**
   * Refresh the roles cache from database
   */
  async refreshCache(): Promise<void> {
    const roles = await this.roleModel.find({ isActive: true }).exec();

    this.rolesCache.clear();
    roles.forEach((role) => {
      this.rolesCache.set(role.name, role.toObject());
    });

    this.cacheTimestamp = Date.now();
  }

  /**
   * Ensure cache is fresh
   */
  private async ensureCache(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp > this.CACHE_TTL) {
      await this.refreshCache();
    }
  }

  /**
   * Convert Role entity to DTO
   */
  private toDto(role: Role): RoleDto {
    return {
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      privileges: role.privileges,
      isActive: role.isActive,
      priority: role.priority,
    };
  }
}
