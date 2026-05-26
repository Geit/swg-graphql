import { ALL_PERMISSIONS, Permission } from './permissions';
import { KIBANA_PRIVILEGE_TO_PERMISSIONS } from './kibanaPrivilegeMap';
import { ROLE_BUNDLES, RoleName } from './roleBundles';

export interface AuthContribution {
  permissions?: readonly string[];
  roleContributions?: Partial<Record<RoleName, readonly string[]>>;
  // Multiple modules contributing the same key get array-concatenated.
  kibanaPrivileges?: Record<string, readonly string[]>;
}

interface AuthRegistry {
  readonly allPermissions: ReadonlySet<string>;
  readonly isPermission: (s: string) => boolean;
  readonly isKibanaPrivilege: (s: string) => boolean;
  readonly expandRoles: (roles: readonly RoleName[]) => Set<Permission>;
  readonly kibanaPrivilegeMap: ReadonlyMap<string, readonly string[]>;
  readonly privilegesToProbe: readonly string[];
}

const buildRegistry = (contributions: readonly AuthContribution[]): AuthRegistry => {
  const allPermissions = new Set<string>(ALL_PERMISSIONS);
  for (const c of contributions) {
    for (const p of c.permissions ?? []) allPermissions.add(p);
  }

  const roleMap = new Map<RoleName, Set<string>>();
  for (const [role, perms] of Object.entries(ROLE_BUNDLES) as [RoleName, readonly Permission[]][]) {
    roleMap.set(role, new Set(perms));
  }
  for (const c of contributions) {
    for (const [role, perms] of Object.entries(c.roleContributions ?? {}) as [RoleName, readonly string[]][]) {
      let bag = roleMap.get(role);
      if (!bag) {
        bag = new Set();
        roleMap.set(role, bag);
      }
      for (const p of perms) bag.add(p);
    }
  }

  roleMap.set('admin', new Set(allPermissions));

  const kibanaMap = new Map<string, string[]>();
  for (const [k, v] of Object.entries(KIBANA_PRIVILEGE_TO_PERMISSIONS)) {
    kibanaMap.set(k, [...v]);
  }
  for (const c of contributions) {
    for (const [k, v] of Object.entries(c.kibanaPrivileges ?? {})) {
      const existing = kibanaMap.get(k);
      if (existing) existing.push(...v);
      else kibanaMap.set(k, [...v]);
    }
  }

  return {
    allPermissions,
    isPermission: s => allPermissions.has(s),
    isKibanaPrivilege: s => kibanaMap.has(s),
    expandRoles: roles => {
      const out = new Set<Permission>();
      for (const r of roles) {
        const bag = roleMap.get(r);
        if (bag) for (const p of bag) out.add(p as Permission);
      }
      return out;
    },
    kibanaPrivilegeMap: kibanaMap,
    privilegesToProbe: Array.from(kibanaMap.keys()),
  };
};

// Pre-seeded with core-only data so unit tests and pre-bootstrap paths don't have to install one.
let registry: AuthRegistry = buildRegistry([]);

export const installAuthRegistry = (contributions: readonly AuthContribution[]): void => {
  registry = buildRegistry(contributions);
};

export const getAuthRegistry = (): AuthRegistry => registry;

export const isPermission = (value: string): value is Permission => registry.isPermission(value);

export const isKibanaPrivilege = (value: string): boolean => registry.isKibanaPrivilege(value);

export const expandRoles = (roles: readonly RoleName[]): Set<Permission> => registry.expandRoles(roles);
