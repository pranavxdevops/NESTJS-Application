import { SetMetadata } from "@nestjs/common";

/**
 * @Roles decorator - Specify required roles for endpoint access
 *
 * Usage:
 * @Roles("admin", "editor")
 * async someProtectedEndpoint() { ... }
 *
 * Must be used with RolesGuard:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles("admin")
 * async adminOnly() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
