import { ALL_PERMISSIONS, PERMISSIONS, Permission } from './permissions';

const READ_ONLY_PERMISSIONS: Permission[] = [
  PERMISSIONS.OBJECTS_READ,
  PERMISSIONS.ACCOUNTS_READ,
  PERMISSIONS.LOGINS_READ,
  PERMISSIONS.GUILDS_READ,
  PERMISSIONS.CITIES_READ,
  PERMISSIONS.RESOURCES_READ,
  PERMISSIONS.MARKET_READ,
  PERMISSIONS.SEARCH_READ,
  PERMISSIONS.TRANSACTIONS_READ,
  PERMISSIONS.TRADE_ANALYSIS_READ,
  PERMISSIONS.SESSIONS_READ,
];

export const ROLE_BUNDLES = {
  csrReadonly: READ_ONLY_PERMISSIONS,
  csrAnalyst: [...READ_ONLY_PERMISSIONS, PERMISSIONS.TRADE_ANALYSIS_LABEL],
  admin: ALL_PERMISSIONS,
} as const satisfies Record<string, readonly Permission[]>;

export type RoleName = keyof typeof ROLE_BUNDLES;

export const isRoleName = (value: string): value is RoleName => value in ROLE_BUNDLES;

export const expandRoles = (roles: readonly RoleName[]): Set<Permission> => {
  const result = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_BUNDLES[role]) result.add(perm);
  }
  return result;
};
