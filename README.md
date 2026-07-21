# Permission Matrix Builder

## What This Library Does

A role-based access control (RBAC) library that lets you declare **all permissions in one place** and enforce them automatically via middleware. Instead of scattering `if (user.role === 'admin')` checks throughout your codebase, you define a single permission matrix once, and the library handles checking it consistently everywhere.

**Features:**
- **Declarative DSL** – define roles, resources, actions, and scopes in one readable structure instead of ad-hoc conditionals.
- **Multiple roles** – a single user can hold any number of roles at once (e.g. both `editor` and `billing-admin`).
- **Wildcard actions** – use `'*'` to grant every action on a resource instead of listing each one.
- **Deny overrides allow** – if any rule explicitly denies an action, that denial wins even if another rule would have allowed it.
- **Ownership checks** – scope a permission so it only applies to resources the user themselves owns (e.g. "edit own posts" vs. "edit any post").
- **Role inheritance** – one role can extend another, inheriting its permissions (with cycle detection so `A extends B extends A` fails fast instead of infinite-looping).
- **Default deny** – anything not explicitly allowed is denied. There's no way to accidentally leave a gap open.
- **Middleware** – Express middleware that checks permissions automatically on incoming requests, so route handlers don't need manual checks.

---

## Installation

```bash
npm install permission-matrix-builder
```

---

## Running Tests

```bash
npm test
```

This runs the full test suite once and exits. If you're working on the library itself (not just consuming it), run this before committing to confirm none of the DSL parsing, precedence, or inheritance logic has broken.

---

## Defining the Matrix (DSL Reference)

The permission matrix is built from four pieces:

| Concept | What It Means | Example |
|---|---|---|
| **Role** | A label assigned to a user (e.g. `admin`, `editor`, `viewer`) | `"editor"` |
| **Resource** | The type of thing being protected | `"posts"`, `"invoices"` |
| **Action** | What's being done to that resource | `"create"`, `"read"`, `"update"`, `"delete"`, or `"*"` for all actions |
| **Scope** | An optional restriction on *which* instances of the resource the rule applies to | `"own"` (only resources the user owns) vs. no scope (any resource) |

A rule reads like a sentence: *"Role X can perform Action Y on Resource Z, [optionally limited to only resources they own]."*

Define the matrix with `definePermissions`:

```js
import { definePermissions } from "permission-matrix-builder";

const permissions = definePermissions({
  roles: {
    viewer: {
      posts: ["read"],
    },
    editor: {
      extends: "viewer",
      posts: {
        actions: ["update", "delete"],
        scope: "own",
      },
      comments: ["*"],
    },
    admin: {
      posts: ["*"],
      comments: ["*"],
      users: ["*"],
      deny: {
        users: ["delete"],
      },
    },
  },
});
```

A resource's rules can be written two ways:
- **Shorthand array** – `posts: ["read", "update"]` – a plain list of allowed actions, unscoped.
- **Object form** – `posts: { actions: [...], scope: "own" }` – needed whenever you want to attach a scope.

Anything not listed anywhere in the matrix is denied by default — there's no implicit "allow everything unless denied" mode. This means adding a brand-new resource type to your app is safe by default; nobody can touch it until you write a rule for it.

---

## Checking a Permission

Use `can()` to check a permission directly in your own code:

```js
import { can } from "permission-matrix-builder";

const allowed = can(user, "update", "posts");

if (allowed) {
  // proceed with the update
}
```

`user` is expected to have a `roles` array (e.g. `user.roles = ["editor"]`). The library checks every role the user holds and allows the action if *any* role grants it — unless a deny rule blocks it.

For ownership-scoped rules, pass the actual resource instance instead of just its type name, so the library has something to check ownership against:

```js
can(user, "delete", post); // post needs an `ownerId` (or similar) field to compare against user.id
```

---

## Attaching the Middleware

For HTTP APIs, the library ships an Express middleware so you don't need to manually call `can()` in every route handler.

```js
import { requirePermission } from "permission-matrix-builder";

app.put(
  "/posts/:id",
  requirePermission("update", "posts"),
  (req, res) => {
    // this handler only runs if the permission check passed
  }
);
```

For ownership-scoped rules, the middleware needs a way to load the resource so it can check ownership. Pass a loader function:

```js
app.delete(
  "/posts/:id",
  requirePermission("delete", "posts", {
    loadResource: async (req) => await Post.findById(req.params.id),
  }),
  (req, res) => {
    // only runs if the user owns this specific post (or has an unscoped "delete" grant)
  }
);
```

If the check fails, the middleware responds with a `403 Forbidden` and never calls your route handler.

---

## Multiple Roles

A user isn't limited to one role. If a user has `roles: ["viewer", "editor"]`, the library evaluates the permissions from both roles and combines them — the user gets the union of what each role allows.

```js
const user = { id: 1, roles: ["viewer", "editor"] };

can(user, "update", "posts"); // true — granted via the "editor" role
can(user, "read", "posts");   // true — granted via both roles
```

---

## Wildcard Actions

Instead of listing every action a role can take on a resource, use `'*'`:

```js
admin: {
  posts: ["*"], // equivalent to ["read", "create", "update", "delete", ...]
}
```

This is shorthand for "all actions currently and future defined on this resource" — it does **not** grant access to resources not listed at all. An admin with only `posts: ["*"]` still can't touch `comments` unless `comments` is also listed under `admin`.

---

## Deny Rules and Precedence

Sometimes you need to grant broad access but carve out an exception. Explicit deny rules always win, regardless of what any allow rule says — including wildcards.

```js
const permissions = definePermissions({
  roles: {
    editor: {
      posts: ["*"],
      deny: {
        posts: ["delete"], // even though "*" would normally include delete
      },
    },
  },
});

can(user, "delete", "posts"); // false — deny wins over "*"
```

**Precedence order, highest to lowest:**
1. **Explicit deny** on a role — always wins, no matter what else grants the action.
2. **Explicit allow** on a role (including via `'*'`).
3. **Inherited allow** from an extended role.
4. **Default deny** — if nothing above matched, the action is denied.

This means you can safely use broad wildcards for convenience and still lock down specific dangerous actions without rewriting the whole rule.

---

## Ownership Checks

Not every permission should apply to *every* instance of a resource. The `'own'` scope restricts a rule so it only applies to resources the requesting user actually owns.

```js
const permissions = definePermissions({
  roles: {
    editor: {
      posts: {
        actions: ["update", "delete"],
        scope: "own", // can only update/delete posts they authored
      },
    },
    admin: {
      posts: ["*"], // no scope = applies to any post, not just their own
    },
  },
});
```

If no scope is set on a rule, it's treated as unrestricted — it applies to all resources of that type, not just ones the user owns. Ownership checks only run when you pass an actual resource instance to `can()` (or a loader to the middleware) — passing just a resource type string skips the ownership comparison entirely.

---

## Role Inheritance

Roles can extend other roles, inheriting all of their permissions. This avoids repeating the same rules across similar roles.

```js
const permissions = definePermissions({
  roles: {
    viewer: {
      posts: ["read"],
    },
    editor: {
      extends: "viewer", // inherits "read" on posts automatically
      posts: ["update"],
    },
  },
});

// editor now effectively has: posts: ["read", "update"]
```

**Cycle detection:** if you accidentally create a loop — e.g. role `A` extends `B`, and `B` extends `A` — the library detects this at definition time and throws an error instead of causing an infinite loop when permissions are resolved.

---

## Known Limitations

- **Scopes beyond `'own'` aren't built in.** If you need more granular scoping (e.g. "only within my team" or "only in my region"), you'd need to extend the library or write a custom check.
- **No built-in caching.** Permission checks are evaluated fresh each call; for very high-throughput APIs you may want to memoize results per request.
- **Middleware is Express-specific.** There's no built-in adapter for other frameworks (Fastify, Koa, etc.) — you'd need to wrap `can()` manually.