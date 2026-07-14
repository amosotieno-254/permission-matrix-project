import { describe, it, expect } from "vitest";
import {
  loadMatrix,
  can,
  CycleError,
  ConfigError,
} from "../../../src/index.js";

describe("Role Inheritance & Cycle Detection", () => {
  it("should inherit parent rules correctly", () => {
    const config = {
      roles: { admin: { extends: "user" }, user: {} },
      rules: [
        {
          role: "user",
          resource: "article",
          actions: ["read"],
          scope: "any" as const,
          effect: "allow" as const,
        },
      ],
    };
    const matrix = loadMatrix(config);
    const user = { id: "u1", roles: ["admin"] };
    const resource = { id: "r1", type: "article", ownerId: "u2" };
    expect(can(matrix, user, "read", resource)).toBe(true);
  });

  it("should throw CycleError on circular inheritance", () => {
    const config = {
      roles: { a: { extends: "b" }, b: { extends: "a" } },
      rules: [],
    };
    expect(() => loadMatrix(config)).toThrow(CycleError);
  });

  it("should throw ConfigError for unknown parent", () => {
    const config = {
      roles: { a: { extends: "b" } },
      rules: [],
    };
    expect(() => loadMatrix(config)).toThrow(ConfigError);
  });
});
