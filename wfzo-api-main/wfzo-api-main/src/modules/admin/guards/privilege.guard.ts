import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleService } from "../services/role.service";
import { Privilege } from "../schemas/role.schema";
import { PRIVILEGES_KEY, PRIVILEGE_LOGIC_KEY } from "../decorators/require-privilege.decorator";

/**
 * Guard to check if user has required privileges
 * Works with @RequirePrivileges decorator
 * 
 * Usage in controller:
 * @UseGuards(JwtAuthGuard, PrivilegeGuard)
 * @RequirePrivileges(Privilege.MEMBERS_READ)
 * async getMembers() { ... }
 */
@Injectable()
export class PrivilegeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required privileges from decorator
    const requiredPrivileges = this.reflector.getAllAndOverride<Privilege[]>(PRIVILEGES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no privileges required, allow access
    if (!requiredPrivileges || requiredPrivileges.length === 0) {
      return true;
    }

    // Get logic type (AND/OR)
    const logic =
      this.reflector.getAllAndOverride<"AND" | "OR">(PRIVILEGE_LOGIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || "OR";

    // Get user from request (set by JWT auth guard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    // Get user's roles from internal user (role codes as strings)
    const userRoles = user.roles as string[];

    if (!userRoles || userRoles.length === 0) {
      throw new ForbiddenException("User has no roles assigned");
    }

    // Check privileges based on logic type
    let hasAccess: boolean;

    if (logic === "AND") {
      hasAccess = await this.roleService.hasAllPrivileges(userRoles, requiredPrivileges);
    } else {
      hasAccess = await this.roleService.hasAnyPrivilege(userRoles, requiredPrivileges);
    }

    if (!hasAccess) {
      throw new ForbiddenException(
        `Insufficient privileges. Required: ${requiredPrivileges.join(", ")}`,
      );
    }

    return true;
  }
}
