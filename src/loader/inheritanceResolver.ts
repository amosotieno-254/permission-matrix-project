import type { RoleConfig } from "../types/index.js";
import { CycleError } from "../errors.js";

export function resolveInheritance(
  roles: Record<string, RoleConfig>,
): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const roleName of Object.keys(roles)) {
    const visited = new Set<string>();
    const chain: string[] = [];

    function traverse(currentRole: string): void {
      if (visited.has(currentRole)) {
        throw new CycleError(
          `Circular inheritance detected: ${Array.from(visited).join(" -> ")} -> ${currentRole}`,
        );
      }

      visited.add(currentRole);

      const config = roles[currentRole];
      if (!config || !config.extends) {
        return;
      }

      const parent = config.extends;

      if (!roles[parent]) {
        throw new CycleError(
          `Role '${currentRole}' extends unknown role '${parent}'`,
        );
      }

      chain.push(parent);
      traverse(parent);
    }

    traverse(roleName);
    result.set(roleName, chain);
  }

  return result;
}
