import type { MatrixConfig, NormalizedMatrix, Rule } from "../types/index.js";
import { resolveInheritance } from "./inheritanceResolver.js";
import { validateRules, validateRoles } from "./validators.js";

export function loadMatrix(config: MatrixConfig): NormalizedMatrix {
  validateRoles(config.roles);
  validateRules(config.rules, Object.keys(config.roles));

  const resolvedRoles = resolveInheritance(config.roles);

  const rulesMap = buildRulesMap(config.rules, resolvedRoles);

  return {
    rules: rulesMap,
    roleInheritance: resolvedRoles,
  };
}

function buildRulesMap(
  rules: Rule[],
  resolvedRoles: Map<string, string[]>,
): NormalizedMatrix["rules"] {
  const map = new Map();

  const rulesByRole = new Map<string, Rule[]>();
  for (const rule of rules) {
    if (!rulesByRole.has(rule.role)) {
      rulesByRole.set(rule.role, []);
    }
    rulesByRole.get(rule.role)!.push(rule);
  }

  for (const [role, inheritedRoles] of resolvedRoles) {
    const allRules = [...(rulesByRole.get(role) || [])];

    for (const parentRole of inheritedRoles) {
      const parentRules = rulesByRole.get(parentRole) || [];
      allRules.push(...parentRules);
    }

    const resourceMap = new Map();
    for (const rule of allRules) {
      if (!resourceMap.has(rule.resource)) {
        resourceMap.set(rule.resource, {
          allow: new Set<string>(),
          deny: new Set<string>(),
          scope: rule.scope,
        });
      }
      const entry = resourceMap.get(rule.resource);

      if (rule.effect === "allow") {
        rule.actions.forEach((a: string) => entry.allow.add(a));
      } else {
        rule.actions.forEach((a: string) => entry.deny.add(a));
      }

      entry.scope = rule.scope;
    }

    map.set(role, resourceMap);
  }

  return map;
}
