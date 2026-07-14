// @ts-nocheck
import { loadMatrix, can } from "./src/index.js";

console.log(" Testing Phase 3: Wildcards & Deny Precedence\n");

const matrix = loadMatrix({
  roles: {
    admin: {},
    moderator: {},
    editor: {},
  },
  rules: [
    // Admin: wildcard allow on all resources
    {
      role: "admin",
      resource: "*",
      actions: ["*"],
      scope: "any",
      effect: "allow",
    },

    // Moderator: wildcard allow on articles, but explicit deny on delete
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

    // Editor: specific allow on update
    {
      role: "editor",
      resource: "article",
      actions: ["update"],
      scope: "any",
      effect: "allow",
    },
  ],
});

console.log(" Test 1: Admin wildcard allows delete on ANY resource");
const result1 = can(matrix, { id: "admin1", roles: ["admin"] }, "delete", {
  id: "a1",
  type: "user",
  ownerId: "user2",
});
console.log(
  result1 ? " PASS: Wildcard allow works" : "FAIL: Admin should be allowed",
);

console.log("\n Test 2: Admin wildcard allows read on ANY resource");
const result2 = can(matrix, { id: "admin1", roles: ["admin"] }, "read", {
  id: "a2",
  type: "settings",
  ownerId: "admin1",
});
console.log(
  result2
    ? " PASS: Wildcard covers any action"
    : " FAIL: Admin should be allowed",
);

console.log("\ Test 3: Moderator wildcard allows update on article");
const result3 = can(matrix, { id: "mod1", roles: ["moderator"] }, "update", {
  id: "a3",
  type: "article",
  ownerId: "user3",
});
console.log(
  result3
    ? " PASS: Wildcard allows update"
    : "FAIL: Moderator should be allowed",
);

console.log("\n Test 4: Moderator DENY overrides wildcard allow (delete)");
const result4 = can(matrix, { id: "mod1", roles: ["moderator"] }, "delete", {
  id: "a4",
  type: "article",
  ownerId: "user4",
});
console.log(
  result4
    ? " FAIL: Deny should override wildcard"
    : "PASS: Deny beats wildcard allow",
);

console.log("\n Test 5: Editor (specific allow) can update article");
const result5 = can(matrix, { id: "editor1", roles: ["editor"] }, "update", {
  id: "a5",
  type: "article",
  ownerId: "user5",
});
console.log(
  result5 ? "PASS: Specific allow works" : " FAIL: Editor should be allowed",
);

console.log("\nTest 6: Editor cannot delete (no allow rule)");
const result6 = can(matrix, { id: "editor1", roles: ["editor"] }, "delete", {
  id: "a6",
  type: "article",
  ownerId: "user6",
});
console.log(
  result6
    ? " FAIL: Editor should be denied"
    : " PASS: Default deny for missing rule",
);

console.log(
  "\n Test 7: Deny beats specific allow (moderator only has deny on delete)",
);
const result7 = can(matrix, { id: "mod2", roles: ["moderator"] }, "delete", {
  id: "a7",
  type: "article",
  ownerId: "user7",
});
console.log(
  result7 ? " FAIL: Deny should beat wildcard" : " PASS: Deny always wins",
);

console.log(
  "\n Test 8: Multiple roles - Editor + Moderator (deny from moderator should win)",
);
const result8 = can(
  matrix,
  { id: "both", roles: ["editor", "moderator"] },
  "delete",
  { id: "a8", type: "article", ownerId: "user8" },
);
console.log(
  result8
    ? " FAIL: Deny from moderator should win"
    : " PASS: Deny wins even with another role having allow",
);

console.log("\n🏁 Phase 3 testing complete!");
