import { describe, it, expect } from "vitest";
import { loadMatrix, can } from "../../../src/index.js";

describe("Ownership Checks (scope: own)", () => {
  const matrix = loadMatrix({
    roles: { editor: {} },
    rules: [
      {
        role: "editor",
        resource: "article",
        actions: ["update"],
        scope: "own",
        effect: "allow",
      },
    ],
  });

  it("should allow update on own article", () => {
    const user = { id: "u1", roles: ["editor"] };
    const resource = { id: "r1", type: "article", ownerId: "u1" };
    expect(can(matrix, user, "update", resource)).toBe(true);
  });

  it("should deny update on someone else's article", () => {
    const user = { id: "u1", roles: ["editor"] };
    const resource = { id: "r2", type: "article", ownerId: "u2" };
    expect(can(matrix, user, "update", resource)).toBe(false);
  });
});
