import type { Rule, RoleConfig } from "../types/index.js";
import { ConfigError } from "../errors.js";

export function validateRoles(roles: Record<string, RoleConfig>): void {
  if (!roles || typeof roles !== "object" || Object.keys(roles).length === 0) {
    throw new ConfigError("Roles must be a non-empty object");
  }

  for (const roleName of Object.keys(roles)) {
    if (!roleName || roleName.trim() === "") {
      throw new ConfigError("Role name cannot be empty");
    }
  }
}

export function validateRules(rules: Rule[], validRoles: string[]): void {
  if (!Array.isArray(rules)) {
    throw new ConfigError("Rules must be an array");
  }

  const validRoleSet = new Set(validRoles);

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (!rule.role) {
      throw new ConfigError(`Rule at index ${i} is missing 'role'`);
    }

    if (!validRoleSet.has(rule.role)) {
      throw new ConfigError(`Rule references unknown role '${rule.role}'`);
    }

    if (!rule.resource || rule.resource.trim() === "") {
      throw new ConfigError(
        `Rule for role '${rule.role}' is missing 'resource'`,
      );
    }

    if (
      !rule.actions ||
      !Array.isArray(rule.actions) ||
      rule.actions.length === 0
    ) {
      throw new ConfigError(
        `Rule for role '${rule.role}' on '${rule.resource}' has no actions`,
      );
    }

    if (rule.scope !== "any" && rule.scope !== "own") {
      throw new ConfigError(
        `Rule for role '${rule.role}' has invalid scope '${rule.scope}'. Must be 'any' or 'own'`,
      );
    }

    if (rule.effect !== "allow" && rule.effect !== "deny") {
      throw new ConfigError(
        `Rule for role '${rule.role}' has invalid effect '${rule.effect}'. Must be 'allow' or 'deny'`,
      );
    }
  }
}
