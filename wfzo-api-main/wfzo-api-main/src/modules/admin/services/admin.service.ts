import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { InternalLoginRequestDto, InternalLoginResponseDto } from "../dto/internal-login.dto";
import {
  InternalUserCreateRequestDto,
  InternalUserDto,
  InternalUserUpdateRequestDto,
} from "../dto/internal-user.dto";
import { RoleListItemDto } from "../dto/role-list.dto";
import { CreateRoleDto, UpdateRoleDto } from "../dto/role-management.dto";
import { InternalUser } from "../schemas/internal-user.schema";
import { InternalUserRepository } from "../repository/internal-user.repository";
import { FilterQuery, UpdateQuery } from "mongoose";
import { RoleService } from "./role.service";
import { RolesAndPrivilegesDto } from "../dto/role.dto";
import { Role } from "../schemas/role.schema";
import { EmailService } from "@shared/email/email.service";
import { EmailTemplateCode } from "@shared/email/schemas/email-template.schema";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AdminService {

  constructor(
    private readonly repo: InternalUserRepository,
    private readonly jwt: JwtService,
    private readonly roleService: RoleService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: InternalLoginRequestDto): Promise<InternalLoginResponseDto> {
    const filter: FilterQuery<InternalUser> = { email: dto.email, status: "active" };
    const user = await this.repo.findOne(filter);
    console.log(`[ADMIN] Login attempt for ${dto.email}:`, user ? "User found" : "User not found");
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException("Password not set for this user");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Generate JWT token with userType marker
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      userType: "internal", // Mark as internal admin user
    };
    const token = await this.jwt.signAsync(payload);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    return { token, expiresAt };
  }

  async list(params: { page?: number; pageSize?: number; q?: string; role?: string }) {
    const orFilter: FilterQuery<InternalUser> = params.q
      ? ({
          $or: [
            { email: { $regex: params.q, $options: "i" } },
            { displayName: { $regex: params.q, $options: "i" } },
          ],
        } as unknown as FilterQuery<InternalUser>)
      : ({} as FilterQuery<InternalUser>);

    const rolesFilter: FilterQuery<InternalUser> = params.role
      ? ({
          roles: { $in: [params.role] },
        } as unknown as FilterQuery<InternalUser>)
      : ({} as FilterQuery<InternalUser>);

    const filter: FilterQuery<InternalUser> = { ...orFilter, ...rolesFilter };

    const res = await this.repo.findAll(filter, {
      page: params.page,
      pageSize: params.pageSize,
    });
    return res;
  }

  async create(dto: InternalUserCreateRequestDto): Promise<InternalUserDto> {
    // Validate that role codes exist
    if (dto.roles && dto.roles.length > 0) {
      await this.roleService.validateRoleCodes(dto.roles);
    }

    // Generate temporary password if not provided
    const tempPassword = this.generateTemporaryPassword();
    // const tempPassword = 'test1234'; // TODO: Remove hardcoded password
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Auto-generate displayName from firstName and lastName if not provided
    const displayName = dto.displayName || 
      (dto.firstName || dto.lastName 
        ? `${dto.firstName || ''} ${dto.lastName || ''}`.trim() 
        : undefined);

    const doc: Partial<InternalUser> = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName,
      roles: dto.roles ?? [],
      status: "active",
      passwordHash,
      deletedAt: null,
    };
    const created = await this.repo.create(doc);

    // Send email with temporary password
    try {
      const adminPortalUrl = this.configService.get<string>("ADMIN_PORTAL_URL") || "https://admin.worldfzo.org";
         const rolesList = (dto.roles ?? []).join(", ");
      const emailParams = {
        userEmail: dto.email,
        firstName: dto.firstName || "",
        lastName: dto.lastName || "",
        temporaryPassword: tempPassword,
        userRoles: rolesList,
        adminPortalUrl,
      };
      console.log(`[ADMIN] Sending credentials email to ${dto.email}`, { emailParams });
      await this.emailService.sendTemplatedEmail({
        templateCode: EmailTemplateCode.INTERNAL_USER_CREDENTIALS,
        language: "en",
        to: dto.email,
        params: emailParams
      } as never);
      console.log(`[ADMIN] Created internal user: ${dto.email}, credentials sent via email`);
    } catch (error) {
      console.error(`[ADMIN] Failed to send credentials email to ${dto.email}:`, error);
      // Don't fail the user creation if email fails
    }

    return created as unknown as InternalUserDto;
  }

  async setPassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const filter: FilterQuery<InternalUser> = { id: userId };
    const update: UpdateQuery<InternalUser> = { $set: { passwordHash } };
    const updated = await this.repo.updateOne(filter, update);
    if (!updated) throw new NotFoundException("User not found");
  }

  private generateTemporaryPassword(): string {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async getById(userId: string): Promise<InternalUserDto> {
    const filter: FilterQuery<InternalUser> = { id: userId };
    const found = await this.repo.findOne(filter);
    if (!found) throw new NotFoundException();
    return found as unknown as InternalUserDto;
  }

  async update(userId: string, dto: InternalUserUpdateRequestDto): Promise<InternalUserDto> {
    // Validate role codes if provided
    if (dto.roles && dto.roles.length > 0) {
      await this.roleService.validateRoleCodes(dto.roles);
    }

    const filter: FilterQuery<InternalUser> = { id: userId };
    const set: Partial<InternalUser> = {};
    if (dto.firstName !== undefined) set.firstName = dto.firstName;
    if (dto.lastName !== undefined) set.lastName = dto.lastName;
    if (dto.displayName !== undefined) set.displayName = dto.displayName;
    
    // Auto-generate displayName if firstName or lastName changed but displayName not provided
    if ((dto.firstName !== undefined || dto.lastName !== undefined) && dto.displayName === undefined) {
      const user = await this.repo.findOne({ id: userId });
      if (user) {
        const firstName = dto.firstName !== undefined ? dto.firstName : user.firstName;
        const lastName = dto.lastName !== undefined ? dto.lastName : user.lastName;
        set.displayName = `${firstName || ''} ${lastName || ''}`.trim();
      }
    }
    
    if (dto.roles !== undefined) set.roles = dto.roles;
    if (dto.status !== undefined) set.status = dto.status;
    const update: UpdateQuery<InternalUser> = { $set: set };
    const updated = await this.repo.updateOne(filter, update);
    if (!updated) throw new NotFoundException();
    return updated as unknown as InternalUserDto;
  }

  async delete(userId: string): Promise<void> {
    const filter: FilterQuery<InternalUser> = { id: userId };
    const ok = await this.repo.deleteOne(filter, false);
    if (!ok) throw new NotFoundException();
  }

  roles(): Array<{ key: string; name: string }> {
    return [
      { key: "admin", name: "Administrator" },
      { key: "editor", name: "Editor" },
      { key: "viewer", name: "Viewer" },
    ];
  }

  /**
   * Get all roles and privileges
   * Used by frontend for role selection and backend for authorization
   */
  async getRolesAndPrivileges(): Promise<RolesAndPrivilegesDto> {
    return this.roleService.getAllRolesAndPrivileges();
  }

  /**
   * Get simplified list of roles for UI selection
   * Used in internal user creation/editing forms
   */
  async listRoles(): Promise<RoleListItemDto[]> {
    const rolesData = await this.roleService.getAllRolesAndPrivileges();
    
    // Return simplified format for dropdown/selection UI
    return rolesData.roles.map((role) => ({
      code: role.name,
      name: role.displayName,
      description: role.description,
      privilegeCount: role.privileges.length,
    }));
  }

  // ========== Role Management Methods ==========

  /**
   * Create a new role
   */
  async createRole(dto: CreateRoleDto): Promise<Role> {
    return this.roleService.createRole(dto);
  }

  /**
   * Update an existing role
   */
  async updateRole(roleName: string, dto: UpdateRoleDto): Promise<Role> {
    return this.roleService.updateRole(roleName, dto);
  }

  /**
   * Delete a role (soft delete)
   */
  async deleteRole(roleName: string): Promise<void> {
    return this.roleService.deleteRole(roleName);
  }

  /**
   * Get a specific role
   */
  async getRole(roleName: string): Promise<Role> {
    return this.roleService.getRoleByName(roleName);
  }
}
