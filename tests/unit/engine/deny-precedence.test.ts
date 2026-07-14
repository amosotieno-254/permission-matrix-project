import { describe, it, expect } from "vitest";
import { loadMatrix, can } from "../../../src/index.js";

describe("Deny Precedence (Deny overrides Allow)", () => {
  const matrix = loadMatrix({
    roles: { moderator: {} },
    rules: [
      {
        role: "moderator",
        resource: "article",
        actions: ["*"],
        scope: "any",
        effect: "allow",
      },
      {
        role: "moderator",
        resource: "article",
        actions: ["delete"],
        scope: "any",
        effect: "deny",
      },
    ],
  });

  it("should allow update (wildcard allow, no deny on update)", () => {
    const user = { id: "u1", roles: ["moderator"] };
    const resource = { id: "r1", type: "article", ownerId: "u2" };
    expect(can(matrix, user, "update", resource)).toBe(true);
  });

  it("should deny delete (explicit deny beats wildcard allow)", () => {
    const user = { id: "u1", roles: ["moderator"] };
    const resource = { id: "r2", type: "article", ownerId: "u2" };
    expect(can(matrix, user, "delete", resource)).toBe(false);
  });
});
