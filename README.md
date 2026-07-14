cat > README.md << 'EOF'
# Permission Matrix Builder

## What This Library Does

A role-based access control (RBAC) library that lets you declare **all permissions in one place** and enforce them via middleware. Features include:

- **Declarative DSL** – define roles, resources, actions, and scopes.
- **Multiple roles** – users can hold any number of roles.
- **Wildcard actions** – use `'*'` to grant all actions.
- **Deny overrides allow** – explicit deny always wins.
- **Ownership checks** – scope rules to `'own'` resources only.
- **Role inheritance** – roles can extend others (with cycle detection).
- **Default deny** – anything not explicitly allowed is denied.
- **Middleware** – Express middleware to enforce permissions automatically.

---

## Installation

```bash
npm install permission-matrix-builder