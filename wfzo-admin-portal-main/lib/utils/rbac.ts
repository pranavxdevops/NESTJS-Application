/**
 * Role-based access control utilities
 */

/**
 * Extract roles from JWT token
 */
export function getRolesFromToken(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.roles || [];
  } catch {
    return [];
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(token: string, requiredRole: string): boolean {
  const roles = getRolesFromToken(token);
  return roles.includes(requiredRole);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(token: string, requiredRoles: string[]): boolean {
  const roles = getRolesFromToken(token);
  return requiredRoles.some(role => roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(token: string, requiredRoles: string[]): boolean {
  const roles = getRolesFromToken(token);
  return requiredRoles.every(role => roles.includes(role));
}

/**
 * Check if user is admin
 */
export function isAdmin(token: string): boolean {
  return hasRole(token, 'ADMIN');
}

/**
 * Get role display name from roles list
 * Note: This is a simple fallback. Use the roles fetched from API for actual display.
 */
export function getRoleName(roleCode: string): string {
  return roleCode;
}

/**
 * Get all role names for display
 * Note: This is a simple fallback. Use the roles fetched from API for actual display.
 */
export function getRoleNames(roleCodes: string[]): string {
  return roleCodes.join(', ');
}
