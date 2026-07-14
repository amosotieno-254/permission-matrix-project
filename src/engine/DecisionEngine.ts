import { User, Resource, NormalizedMatrix } from '../types/index.js';

export function can(
  matrix: NormalizedMatrix,
  user: User,
  action: string,
  resource: Resource
): boolean {
  // GUARD: No roles? Denied.
  if (!user.roles || user.roles.length === 0) {
    return false;
  }

  // Helper to get resource rules (exact match or wildcard '*')
  function getResourceRules(roleRules: Map<string, any>, resourceType: string) {
    // First try exact match
    let rules = roleRules.get(resourceType);
    if (rules) return rules;
    // Then try wildcard
    rules = roleRules.get('*');
    if (rules) return rules;
    // Fallback: iterate to catch any key that might be '*' (paranoia)
    for (const [key, val] of roleRules) {
      if (key === '*') return val;
    }
    return null;
  }

  // PASS 1: Check DENY rules FIRST (Deny always wins)
  for (const roleName of user.roles) {
    const roleRules = matrix.rules.get(roleName);
    if (!roleRules) continue;

    const resourceRules = getResourceRules(roleRules, resource.type);
    if (!resourceRules) continue;

    if (hasMatchingAction(resourceRules.deny, action)) {
      return false;
    }
  }

  // PASS 2: Check ALLOW rules (Only if no deny matched)
  for (const roleName of user.roles) {
    const roleRules = matrix.rules.get(roleName);
    if (!roleRules) continue;

    const resourceRules = getResourceRules(roleRules, resource.type);
    if (!resourceRules) continue;

    if (hasMatchingAction(resourceRules.allow, action)) {
      const scope = resourceRules.scope;

      if (scope === 'any') {
        return true;
      }

      if (scope === 'own' && resource.ownerId === user.id) {
        return true;
      }
    }
  }

  // DEFAULT DENY: No matching allow rule found
  return false;
}

function hasMatchingAction(actions: Set<string>, action: string): boolean {
  return actions.has(action) || actions.has('*');
}
