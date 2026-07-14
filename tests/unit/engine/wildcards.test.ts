import { describe, it, expect } from "vitest";
import { loadMatrix, can } from "../../../src/index.js";

describe("Wildcard Actions", () => {
  const matrix = loadMatrix({
    roles: { admin: {}, moderator: {} },
    rules: [
      {
        role: "admin",
        resource: "*",
        actions: ["*"],
        scope: "any",
        effect: "allow",
      },
      {
        role: "moderator",
        resource: "article",
        actions: ["*"],
        scope: "any",
        effect: "allow",
      },
    ],
  });

  it("should allow any action on any resource for admin", () => {
    const user = { id: "u1", roles: ["admin"] };
    const resource = { id: "r1", type: "user", ownerId: "u2" };
    expect(can(matrix, user, "delete", resource)).toBe(true);
    expect(can(matrix, user, "read", resource)).toBe(true);
  });

  it("should allow any action on article for moderator", () => {
    const user = { id: "u2", roles: ["moderator"] };
    const resource = { id: "r2", type: "article", ownerId: "u3" };
    expect(can(matrix, user, "update", resource)).toBe(true);
    expect(can(matrix, user, "delete", resource)).toBe(true);
  });

  it("should deny action on user for moderator (no wildcard for user)", () => {
    const user = { id: "u2", roles: ["moderator"] };
    const resource = { id: "r3", type: "user", ownerId: "u3" };
    expect(can(matrix, user, "delete", resource)).toBe(false);
  });
});
