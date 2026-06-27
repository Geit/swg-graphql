export const PERMISSIONS = {
  OBJECTS_READ: 'objects:read',
  ACCOUNTS_READ: 'accounts:read',
  LOGINS_READ: 'logins:read',
  GUILDS_READ: 'guilds:read',
  CITIES_READ: 'cities:read',
  RESOURCES_READ: 'resources:read',
  SERVER_FIRSTS_READ: 'serverFirsts:read',
} as const;

// `string & {}` preserves IDE autocomplete on the core literals while still accepting
// module-contributed permission strings registered at runtime via `installAuthRegistry`.
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | (string & {});

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
