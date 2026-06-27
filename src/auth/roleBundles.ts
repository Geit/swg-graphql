import { ALL_PERMISSIONS, PERMISSIONS, Permission } from './permissions';

// Modules add their own perms to these bundles via `AuthContribution.roleContributions`.
// `admin` is re-derived to "every registered permission" at registry-build time.
const READ_ONLY_PERMISSIONS: Permission[] = [
  PERMISSIONS.OBJECTS_READ,
  PERMISSIONS.ACCOUNTS_READ,
  PERMISSIONS.LOGINS_READ,
  PERMISSIONS.GUILDS_READ,
  PERMISSIONS.CITIES_READ,
  PERMISSIONS.RESOURCES_READ,
  PERMISSIONS.SERVER_FIRSTS_READ,
  PERMISSIONS.CHRONICLES_READ,
];

export const ROLE_BUNDLES = {
  csrReadonly: READ_ONLY_PERMISSIONS,
  csrAnalyst: READ_ONLY_PERMISSIONS,
  admin: ALL_PERMISSIONS,
} as const satisfies Record<string, readonly Permission[]>;

export type RoleName = keyof typeof ROLE_BUNDLES;

export const isRoleName = (value: string): value is RoleName => value in ROLE_BUNDLES;
