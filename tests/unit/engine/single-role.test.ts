import { describe, it, expect } from "vitest";
import { loadMatrix, can } from "../../../src/index.js";

describe("Single Role - Default Deny", () => {
  const matrix = loadMatrix({
    roles: { admin: {}, editor: {}, viewer: {} },
    rules: [
      {
        role: "admin",
        resource: "user",
        actions: ["delete"],
        scope: "any",
        effect: "allow",
      },
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

  it("should allow admin to delete", () => {
    const user = { id: "u1", roles: ["admin"] };
    const resource = { id: "r1", type: "user", ownerId: "u2" };
    expect(can(matrix, user, "delete", resource)).toBe(true);
  });

  it("should deny viewer to update (no rule)", () => {
    const user = { id: "u2", roles: ["viewer"] };
    const resource = { id: "r2", type: "article", ownerId: "u3" };
    expect(can(matrix, user, "update", resource)).toBe(false);
  });

  it("should deny unknown role", () => {
    const user = { id: "u3", roles: ["guest"] };
    const resource = { id: "r3", type: "article", ownerId: "u3" };
    expect(can(matrix, user, "read", resource)).toBe(false);
  });
});
