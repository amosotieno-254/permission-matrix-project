import { describe, it, expect } from "vitest";
import { loadMatrix, can } from "../../../src/index.js";

describe("Multiple Roles", () => {
  const matrix = loadMatrix({
    roles: { editor: {}, viewer: {} },
    rules: [
      {
        role: "editor",
        resource: "article",
        actions: ["update"],
        scope: "any",
        effect: "allow",
      },
      {
        role: "viewer",
        resource: "article",
        actions: ["read"],
        scope: "any",
        effect: "allow",
      },
    ],
  });

  it("should allow if any role grants permission", () => {
    const user = { id: "u1", roles: ["viewer", "editor"] };
    const resource = { id: "r1", type: "article", ownerId: "u2" };
    expect(can(matrix, user, "update", resource)).toBe(true);
  });

  it("should deny if no role grants permission", () => {
    const user = { id: "u2", roles: ["viewer"] };
    const resource = { id: "r2", type: "article", ownerId: "u3" };
    expect(can(matrix, user, "delete", resource)).toBe(false);
  });
});
