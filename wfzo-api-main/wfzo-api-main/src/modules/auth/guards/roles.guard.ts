import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

/**
 * RolesGuard - Role-based authorization
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles("admin", "editor")
 * async someAdminEndpoint() { ... }
 *
 * This guard should be used AFTER JwtAuthGuard to ensure
 * the user is authenticated before checking roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>("roles", context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      return false; // No user or no roles, deny access
    }

    // Check if user has at least one of the required roles
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
