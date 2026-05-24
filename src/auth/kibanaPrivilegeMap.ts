import { PERMISSIONS, Permission } from './permissions';

/**
 * Maps Kibana application privileges (within the `kibana-<index>` application) to the SWG GraphQL
 * permissions held by users that have them.
 *
 * Feature IDs come from the bridging Kibana plugin's `registerKibanaFeature` calls. By Kibana
 * convention `feature_X.all` implies `feature_X.read`, so for read-only features we only need to
 * map `.read`; for features with a write op we map both — `.read` for the read perms, `.all` for
 * the additional write perms.
 */
export const KIBANA_PRIVILEGE_TO_PERMISSIONS = {
  'feature_galaxySearch.read': [PERMISSIONS.SEARCH_READ, PERMISSIONS.OBJECTS_READ],
  'feature_logSearch.read': [PERMISSIONS.LOGINS_READ],
  'feature_sessionListings.read': [PERMISSIONS.SESSIONS_READ, PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.OBJECTS_READ],
  'feature_coalitionListings.read': [PERMISSIONS.GUILDS_READ, PERMISSIONS.CITIES_READ, PERMISSIONS.OBJECTS_READ],
  'feature_tradeListings.read': [
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.TRADE_ANALYSIS_READ,
    PERMISSIONS.ACCOUNTS_READ,
    PERMISSIONS.OBJECTS_READ,
  ],
  'feature_tradeListings.all': [PERMISSIONS.TRADE_ANALYSIS_LABEL],
  'feature_resourceListings.read': [PERMISSIONS.RESOURCES_READ],
  'feature_marketListings.read': [PERMISSIONS.MARKET_READ, PERMISSIONS.OBJECTS_READ],
  // planetWatcher is consumed via subscriptions, which are gated by the websocket pre-auth handshake
  // (the gate privilege), not by GraphQL @Authorized.
} as const satisfies Record<string, readonly Permission[]>;

export type KibanaPrivilege = keyof typeof KIBANA_PRIVILEGE_TO_PERMISSIONS;

export const isKibanaPrivilege = (value: string): value is KibanaPrivilege => value in KIBANA_PRIVILEGE_TO_PERMISSIONS;
