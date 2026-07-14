// @ts-nocheck
import { loadMatrix, can } from "./src/index.js";

console.log(" Testing Phase 4: Ownership Checks\n");

const matrix = loadMatrix({
  roles: {
    editor: {},
    viewer: {},
  },
  rules: [
    // Editor: can update ONLY their own articles
    {
      role: "editor",
      resource: "article",
      actions: ["update"],
      scope: "own",
      effect: "allow",
    },

    // Editor: can delete ONLY their own articles
    {
      role: "editor",
      resource: "article",
      actions: ["delete"],
      scope: "own",
      effect: "allow",
    },

    // Viewer: can read ANY article
    {
      role: "viewer",
      resource: "article",
      actions: ["read"],
      scope: "any",
      effect: "allow",
    },
  ],
});

console.log(" Test 1: Editor can update their OWN article");
const result1 = can(matrix, { id: "editor1", roles: ["editor"] }, "update", {
  id: "a1",
  type: "article",
  ownerId: "editor1",
});
console.log(
  result1
    ? " PASS: Editor can update own article"
    : " FAIL: Editor should be allowed",
);

console.log("\nTest 2: Editor CANNOT update SOMEONE ELSE's article");
const result2 = can(matrix, { id: "editor1", roles: ["editor"] }, "update", {
  id: "a2",
  type: "article",
  ownerId: "user2",
});
console.log(
  result2
    ? " FAIL: Editor should be denied"
    : "PASS: Editor cannot update someone else's article",
);

console.log("\n Test 3: Editor can delete their OWN article");
const result3 = can(matrix, { id: "editor1", roles: ["editor"] }, "delete", {
  id: "a3",
  type: "article",
  ownerId: "editor1",
});
console.log(
  result3
    ? " PASS: Editor can delete own article"
    : " FAIL: Editor should be allowed",
);

console.log("\n Test 4: Editor CANNOT delete SOMEONE ELSE's article");
const result4 = can(matrix, { id: "editor1", roles: ["editor"] }, "delete", {
  id: "a4",
  type: "article",
  ownerId: "user4",
});
console.log(
  result4
    ? " FAIL: Editor should be denied"
    : " PASS: Editor cannot delete someone else's article",
);

console.log("\n Test 5: Viewer can read ANY article (scope: any)");
const result5 = can(matrix, { id: "viewer1", roles: ["viewer"] }, "read", {
  id: "a5",
  type: "article",
  ownerId: "user5",
});
console.log(
  result5
    ? "PASS: Viewer can read any article"
    : " FAIL: Viewer should be allowed",
);

console.log(
  "\n Test 6: Viewer CANNOT update (no allow rule for viewer on update)",
);
const result6 = can(matrix, { id: "viewer1", roles: ["viewer"] }, "update", {
  id: "a6",
  type: "article",
  ownerId: "viewer1",
});
console.log(
  result6
    ? "FAIL: Viewer should be denied"
    : " PASS: Viewer cannot update (default deny)",
);

console.log("\n Test 7: User with no roles is denied even on own resource");
const result7 = can(matrix, { id: "guest", roles: [] }, "read", {
  id: "a7",
  type: "article",
  ownerId: "guest",
});
console.log(
  result7 ? "FAIL: No roles should be denied" : " PASS: No roles = denied",
);

console.log(
  "\n Test 8: Editor can update own article even with multiple roles (viewer + editor)",
);
const result8 = can(
  matrix,
  { id: "both", roles: ["viewer", "editor"] },
  "update",
  { id: "a8", type: "article", ownerId: "both" },
);
console.log(
  result8
    ? " PASS: Editor role grants update on own article"
    : " FAIL: Editor should be allowed",
);

console.log("\n🏁 Phase 4 testing complete!");
