// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import { loadMatrix, enforce } from "../../src/index.js";
import { EventEmitter } from "events";

describe("Middleware Integration", () => {
  const matrix = loadMatrix({
    roles: { admin: {}, editor: {} },
    rules: [
      {
        role: "admin",
        resource: "*",
        actions: ["*"],
        scope: "any",
        effect: "allow",
      },
      {
        role: "editor",
        resource: "article",
        actions: ["update"],
        scope: "own",
        effect: "allow",
      },
    ],
  });

  function mockReq(user: any, params: any = {}) {
    return { user, params, get: () => null };
  }

  function mockRes() {
    const res = new EventEmitter();
    let status = 200;
    let body = null;
    res.status = (code) => {
      status = code;
      return res;
    };
    res.json = (b) => {
      body = b;
      res.emit("done");
      return res;
    };
    res._status = () => status;
    res._body = () => body;
    return res;
  }

  it("should call next() when allowed", async () => {
    const req = mockReq({ id: "admin1", roles: ["admin"] }, { id: "a1" });
    const res = mockRes();
    const next = vi.fn(() => res.emit("done"));

    const middleware = enforce(matrix, {
      action: "delete",
      resourceType: "article",
      getResourceOwner: async () => "user2",
    });

    await new Promise((resolve) => {
      res.on("done", resolve);
      middleware(req, res, next);
    });

    expect(next).toHaveBeenCalled();
    expect(res._status()).toBe(200);
  });

  it("should return 403 when denied", async () => {
    const req = mockReq({ id: "editor1", roles: ["editor"] }, { id: "a2" });
    const res = mockRes();
    const next = vi.fn();

    const middleware = enforce(matrix, {
      action: "update",
      resourceType: "article",
      getResourceOwner: async () => "user3",
    });

    await new Promise((resolve) => {
      res.on("done", resolve);
      middleware(req, res, next);
    });

    expect(next).not.toHaveBeenCalled();
    expect(res._status()).toBe(403);
    expect(res._body()).toEqual({
      error: expect.stringContaining("not allowed"),
    });
  });

  it("should return 403 when user not authenticated", async () => {
    const req = mockReq(null, { id: "a3" });
    const res = mockRes();
    const next = vi.fn();

    const middleware = enforce(matrix, {
      action: "read",
      resourceType: "article",
      getResourceOwner: async () => "user4",
    });

    await new Promise((resolve) => {
      res.on("done", resolve);
      middleware(req, res, next);
    });

    expect(next).not.toHaveBeenCalled();
    expect(res._status()).toBe(403);
    expect(res._body()).toEqual({ error: "User not authenticated" });
  });
});
