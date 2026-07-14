// @ts-nocheck
import { loadMatrix, can } from "./src/index.js";

console.log(" Testing Phase 2: Default Deny & Multiple Roles\n");

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

console.log(' Test 1: User with role "guest" (no rules) tries to read article');
const result1 = can(matrix, { id: "u1", roles: ["guest"] }, "read", {
  id: "a1",
  type: "article",
  ownerId: "u2",
});
console.log(result1 ? " FAIL: Should be denied" : " PASS: Default deny works");

console.log(" Test 2: Viewer tries to read article (single role allow)");
const result2 = can(matrix, { id: "u2", roles: ["viewer"] }, "read", {
  id: "a2",
  type: "article",
  ownerId: "u3",
});
console.log(
  result2 ? " PASS: Viewer can read" : " FAIL: Viewer should be allowed",
);

console.log(" Test 3: Viewer tries to update article (no allow rule)");
const result3 = can(matrix, { id: "u3", roles: ["viewer"] }, "update", {
  id: "a3",
  type: "article",
  ownerId: "u3",
});
console.log(
  result3
    ? " FAIL: Viewer should not be able to update"
    : "PASS: Viewer cannot update (default deny)",
);

console.log(
  " Test 4: User with Viewer + Editor tries to update article (multiple roles)",
);
const result4 = can(
  matrix,
  { id: "u4", roles: ["viewer", "editor"] },
  "update",
  { id: "a4", type: "article", ownerId: "u5" },
);
console.log(
  result4
    ? " PASS: Editor role grants update access"
    : " FAIL: Editor role should grant update access",
);

console.log(" Test 5: User with no roles tries to read");
const result5 = can(matrix, { id: "u5", roles: [] }, "read", {
  id: "a5",
  type: "article",
  ownerId: "u5",
});
console.log(
  result5 ? " FAIL: No roles should be denied" : " PASS: No roles = denied",
);

console.log(" Phase 2 testing complete!");
