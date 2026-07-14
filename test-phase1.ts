// @ts-nocheck
import { loadMatrix, ConfigError, CycleError } from "./src/index.js";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

console.log(" Testing Phase 1: Matrix Loader\n");

console.log(" Test 1: Valid configuration");
try {
  const validConfig = {
    roles: { admin: {}, editor: { extends: "admin" }, viewer: {} },
    rules: [
      {
        role: "admin",
        resource: "article",
        actions: ["*"],
        scope: "any",
        effect: "allow",
      },
      {
        role: "editor",
        resource: "article",
        actions: ["update", "delete"],
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
  };
  const matrix = loadMatrix(validConfig);
  console.log(" PASS: Matrix loaded successfully!");
  console.log(`   - Roles loaded: ${matrix.roleInheritance.size}`);
  console.log(
    `   - Editor inherits from: ${matrix.roleInheritance.get("editor")?.join(", ") || "none"}`,
  );
  console.log("");
} catch (err) {
  console.error(" FAIL:", getErrorMessage(err));
  console.log("");
}

console.log(" Test 2: Empty roles (should throw ConfigError)");
try {
  loadMatrix({ roles: {}, rules: [] });
  console.error(" FAIL: Should have thrown an error but didn't");
  console.log("");
} catch (err) {
  if (err instanceof ConfigError) {
    console.log(" PASS: Caught ConfigError:", getErrorMessage(err));
  } else {
  }
  console.log("");
}

console.log(" Test 3: Rule references unknown role (should throw ConfigError)");
try {
  loadMatrix({
    roles: { admin: {} },
    rules: [
      {
        role: "superadmin",
        resource: "article",
        actions: ["*"],
        scope: "any",
        effect: "allow",
      },
    ],
  });
  console.error(" FAIL: Should have thrown an error but didn't");
  console.log("");
} catch (err) {
  if (err instanceof ConfigError) {
    console.log(" PASS: Caught ConfigError:", getErrorMessage(err));
  } else {
    console.error(" FAIL: Wrong error type:", getErrorMessage(err));
  }
  console.log("");
}

console.log(" Test 4: Circular inheritance (should throw CycleError)");
try {
  loadMatrix({
    roles: { a: { extends: "b" }, b: { extends: "a" } },
    rules: [
      {
        role: "a",
        resource: "article",
        actions: ["read"],
        scope: "any",
        effect: "allow",
      },
    ],
  });
  console.error(" FAIL: Should have thrown a CycleError but didn't");
  console.log("");
} catch (err) {
  if (err instanceof CycleError) {
    console.log(" PASS: Caught CycleError:", getErrorMessage(err));
  } else {
    console.error(" FAIL: Wrong error type:", getErrorMessage(err));
  }
  console.log("");
}

console.log(" Test 5: Rule with empty actions (should throw ConfigError)");
try {
  loadMatrix({
    roles: { admin: {} },
    rules: [
      {
        role: "admin",
        resource: "article",
        actions: [],
        scope: "any",
        effect: "allow",
      },
    ],
  });
  console.error(" FAIL: Should have thrown an error but didn't");
  console.log("");
} catch (err) {
  if (err instanceof ConfigError) {
    console.log("PASS: Caught ConfigError:", getErrorMessage(err));
  } else {
    console.error(" FAIL: Wrong error type:", getErrorMessage(err));
  }
  console.log("");
}

console.log("🏁 Phase 1 testing complete!");
