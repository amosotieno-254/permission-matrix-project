// @ts-nocheck
import { loadMatrix, can, enforce } from "./src/index.js";
import { EventEmitter } from "events";

console.log(" Testing Phase 5: Middleware Enforcement\n");

const matrix = loadMatrix({
  roles: {
    admin: {},
    editor: {},
    viewer: {},
  },
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
    {
      role: "viewer",
      resource: "article",
      actions: ["read"],
      scope: "any",
      effect: "allow",
    },
  ],
});

function createMockReq(user, params = {}, body = {}) {
  return { user, params, body, get: () => null };
}

function createMockRes() {
  let statusCode = 200;
  let responseBody = null;
  const res = new EventEmitter();
  res.status = (code) => {
    statusCode = code;
    return res;
  };
  res.json = (body) => {
    responseBody = body;
    res.emit("done");
    return res;
  };
  res._getStatusCode = () => statusCode;
  res._getResponseBody = () => responseBody;
  return res;
}

// Wrap everything in an async function to avoid top-level await issues
const main = async () => {
  console.log(" Test 1: Admin can delete any article (allowed)");
  const req1 = createMockReq({ id: "admin1", roles: ["admin"] }, { id: "a1" });
  const res1 = createMockRes();
  const next1 = () => {
    res1.emit("done");
  };

  const middleware1 = enforce(matrix, {
    action: "delete",
    resourceType: "article",
    getResourceOwner: async (req) => "user2",
  });

  await new Promise((resolve) => {
    res1.on("done", resolve);
    middleware1(req1, res1, next1);
  });

  console.log(
    res1._getStatusCode() === 200
      ? " PASS: Admin can delete"
      : " FAIL: Admin should be allowed",
  );

  console.log("\n Test 2: Editor can update their OWN article (allowed)");
  const req2 = createMockReq(
    { id: "editor1", roles: ["editor"] },
    { id: "a2" },
  );
  const res2 = createMockRes();
  const next2 = () => {
    res2.emit("done");
  };

  const middleware2 = enforce(matrix, {
    action: "update",
    resourceType: "article",
    getResourceOwner: async (req) => "editor1",
  });

  await new Promise((resolve) => {
    res2.on("done", resolve);
    middleware2(req2, res2, next2);
  });

  console.log(
    res2._getStatusCode() === 200
      ? " PASS: Editor can update own article"
      : " FAIL: Editor should be allowed",
  );

  console.log(
    "\n Test 3: Editor CANNOT update SOMEONE ELSE's article (denied)",
  );
  const req3 = createMockReq(
    { id: "editor1", roles: ["editor"] },
    { id: "a3" },
  );
  const res3 = createMockRes();
  const next3 = () => {
    res3.emit("done");
  };

  const middleware3 = enforce(matrix, {
    action: "update",
    resourceType: "article",
    getResourceOwner: async (req) => "user3",
  });

  await new Promise((resolve) => {
    res3.on("done", resolve);
    middleware3(req3, res3, next3);
  });

  console.log(
    res3._getStatusCode() === 403
      ? "PASS: Editor cannot update someone else's article"
      : " FAIL: Editor should be denied",
  );

  console.log("\n Test 4: Viewer can read any article (allowed)");
  const req4 = createMockReq(
    { id: "viewer1", roles: ["viewer"] },
    { id: "a4" },
  );
  const res4 = createMockRes();
  const next4 = () => {
    res4.emit("done");
  };

  const middleware4 = enforce(matrix, {
    action: "read",
    resourceType: "article",
    getResourceOwner: async (req) => "user4",
  });

  await new Promise((resolve) => {
    res4.on("done", resolve);
    middleware4(req4, res4, next4);
  });

  console.log(
    res4._getStatusCode() === 200
      ? " PASS: Viewer can read"
      : " FAIL: Viewer should be allowed",
  );

  console.log("\n Test 5: User with no roles is denied (403)");
  const req5 = createMockReq({ id: "guest", roles: [] }, { id: "a5" });
  const res5 = createMockRes();
  const next5 = () => {
    res5.emit("done");
  };

  const middleware5 = enforce(matrix, {
    action: "read",
    resourceType: "article",
    getResourceOwner: async (req) => "guest",
  });

  await new Promise((resolve) => {
    res5.on("done", resolve);
    middleware5(req5, res5, next5);
  });

  console.log(
    res5._getStatusCode() === 403
      ? "PASS: No roles = 403"
      : "FAIL: Should be denied",
  );

  console.log("\n Test 6: No user (unauthenticated) returns 403");
  const req6 = createMockReq(null, { id: "a6" });
  const res6 = createMockRes();
  const next6 = () => {
    res6.emit("done");
  };

  const middleware6 = enforce(matrix, {
    action: "read",
    resourceType: "article",
    getResourceOwner: async (req) => "user6",
  });

  await new Promise((resolve) => {
    res6.on("done", resolve);
    middleware6(req6, res6, next6);
  });

  console.log(
    res6._getStatusCode() === 403
      ? " PASS: Unauthenticated = 403"
      : " FAIL: Should be 403",
  );

  console.log("\n🏁 Phase 5 testing complete!");
};

main().catch(console.error);
