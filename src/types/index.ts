export type Rule = {
  role: string;
  resource: string;
  actions: string[];
  scope: "any" | "own";
  effect: "allow" | "deny";
};

export type RoleConfig = {
  extends?: string;
};

export type MatrixConfig = {
  roles: Record<string, RoleConfig>;
  rules: Rule[];
};

export type NormalizedRule = {
  role: string;
  resource: string;
  actions: Set<string>;
  scope: "any" | "own";
  effect: "allow" | "deny";
};

export type NormalizedMatrix = {
  rules: Map<
    string,
    Map<string, { allow: Set<string>; deny: Set<string>; scope: "any" | "own" }>
  >;
  roleInheritance: Map<string, string[]>;
};

export type User = {
  id: string;
  roles: string[];
};

export type Resource = {
  id: string;
  type: string;
  ownerId: string;
};

export type EnforceOptions = {
  action: string;
  resourceType: string;
  getResourceOwner: (req: any) => Promise<string> | string;
};
