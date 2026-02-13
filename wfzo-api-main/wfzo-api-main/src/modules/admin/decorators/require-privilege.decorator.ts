import { SetMetadata } from "@nestjs/common";
import { Privilege } from "../schemas/role.schema";

/**
 * Decorator to require specific privileges for an endpoint
 * Can be used with AND or OR logic
 * 
 * Usage:
 * @RequirePrivileges(Privilege.MEMBERS_READ) // Single privilege
 * @RequirePrivileges([Privilege.MEMBERS_READ, Privilege.MEMBERS_UPDATE], 'OR') // Any privilege
 * @RequirePrivileges([Privilege.MEMBERS_READ, Privilege.MEMBERS_UPDATE], 'AND') // All privileges
 */
export const PRIVILEGES_KEY = "privileges";
export const PRIVILEGE_LOGIC_KEY = "privilege_logic";

export const RequirePrivileges = (
  privileges: Privilege | Privilege[],
  logic: "AND" | "OR" = "OR",
) => {
  const privilegeArray = Array.isArray(privileges) ? privileges : [privileges];
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(PRIVILEGES_KEY, privilegeArray)(target, propertyKey!, descriptor!);
    SetMetadata(PRIVILEGE_LOGIC_KEY, logic)(target, propertyKey!, descriptor!);
  };
};
