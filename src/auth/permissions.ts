export const PERMISSIONS = {
  OBJECTS_READ: 'objects:read',
  ACCOUNTS_READ: 'accounts:read',
  LOGINS_READ: 'logins:read',
  GUILDS_READ: 'guilds:read',
  CITIES_READ: 'cities:read',
  RESOURCES_READ: 'resources:read',
  MARKET_READ: 'market:read',
  SEARCH_READ: 'search:read',
  TRANSACTIONS_READ: 'transactions:read',
  TRADE_ANALYSIS_READ: 'tradeAnalysis:read',
  TRADE_ANALYSIS_LABEL: 'tradeAnalysis:label',
  SESSIONS_READ: 'sessions:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

const PERMISSION_SET: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export const isPermission = (value: string): value is Permission => PERMISSION_SET.has(value);
