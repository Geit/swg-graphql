import { GraphQLError } from 'graphql';

import { ELASTIC_KIBANA_INDEX, ELASTIC_REQUIRED_PRIVILEGE, ELASTIC_SEARCH_URL } from '../config';

import { SWGGraphqlContextFunction } from './types';

import { getAuthRegistry, isKibanaPrivilege, Permission } from '@core/auth';

/**
 * Partial response body for the Elastic "Has Privileges" API.
 *
 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-has-privileges.html
 */
interface ElasticHasPrivilegesResponse {
  has_all_requested?: boolean;
  application?: Record<string, Record<string, Record<string, boolean>>>;
}

const KIBANA_APPLICATION = `kibana-${ELASTIC_KIBANA_INDEX}`;

const privilegesToProbe = (): string[] =>
  Array.from(new Set<string>([ELASTIC_REQUIRED_PRIVILEGE, ...getAuthRegistry().privilegesToProbe]));

const PERMISSION_CACHE_TTL_MS = 30_000;
const PERMISSION_CACHE_MAX_ENTRIES = 1000;

interface CacheEntry {
  permissions: Set<Permission>;
  expiresAt: number;
}

const permissionCache = new Map<string, CacheEntry>();

const cacheGet = (token: string): Set<Permission> | null => {
  const entry = permissionCache.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    permissionCache.delete(token);
    return null;
  }
  return entry.permissions;
};

const cacheSet = (token: string, permissions: Set<Permission>): void => {
  if (permissionCache.size >= PERMISSION_CACHE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of permissionCache) {
      if (v.expiresAt <= now) permissionCache.delete(k);
    }
    while (permissionCache.size >= PERMISSION_CACHE_MAX_ENTRIES) {
      const firstKey = permissionCache.keys().next().value;
      if (firstKey === undefined) break;
      permissionCache.delete(firstKey);
    }
  }
  permissionCache.set(token, { permissions, expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS });
};

/** Test-only: clears the per-token permission cache. */
export const _clearPermissionCache = (): void => {
  permissionCache.clear();
};

const forbidden = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'FORBIDDEN', myExtension: 'swg-graphql' } });

const queryPrivileges = async (token: string, privileges: string[]): Promise<ElasticHasPrivilegesResponse> => {
  const response = await fetch(`${ELASTIC_SEARCH_URL}_security/user/_has_privileges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: token,
    },
    body: JSON.stringify({
      application: [
        {
          application: KIBANA_APPLICATION,
          privileges,
          resources: ['*'],
        },
      ],
    }),
  }).catch(() => {
    throw forbidden('Error while confirming authorization');
  });

  if (!response.ok) {
    throw forbidden('Error while confirming authorization');
  }

  return (await response.json()) as ElasticHasPrivilegesResponse;
};

const heldPrivilegesFor = (result: ElasticHasPrivilegesResponse): Set<string> => {
  const resourceMap = result.application?.[KIBANA_APPLICATION]?.['*'] ?? {};
  const held = new Set<string>();
  for (const priv of Object.keys(resourceMap)) {
    if (resourceMap[priv]) held.add(priv);
  }
  return held;
};

/**
 * Validates that the supplied Kibana token has the gate privilege. Throws on failure.
 *
 * Used by the websocket pre-auth route, where we only need a binary allow/deny.
 */
export const checkKibanaToken = async (token: string): Promise<void> => {
  const result = await queryPrivileges(token, [ELASTIC_REQUIRED_PRIVILEGE]);

  if (!result.has_all_requested) {
    throw forbidden('Incorrect authorization');
  }
};

/**
 * Validates the incoming request's Kibana token and builds the request's permission set by mapping
 * the user's Kibana application privileges to SWG GraphQL permissions via [[KIBANA_PRIVILEGE_TO_PERMISSIONS]].
 *
 * The gate privilege ([[ELASTIC_REQUIRED_PRIVILEGE]]) is required — without it the request is rejected
 * regardless of what other Kibana feature privileges the user holds.
 *
 * @throws GraphQLError if the gate privilege is missing or Elastic is unreachable.
 */
export const kibanaAuthorisationContext: SWGGraphqlContextFunction = async params => {
  const token = params.req.headers.authorization;
  if (!token) {
    return {
      isAuthenticated: false,
    };
  }

  const cached = cacheGet(token);
  if (cached) {
    return {
      permissions: cached,
      isAuthenticated: true,
    };
  }

  const result = await queryPrivileges(token, privilegesToProbe());
  const held = heldPrivilegesFor(result);

  if (!held.has(ELASTIC_REQUIRED_PRIVILEGE)) {
    throw forbidden('Incorrect authorization');
  }

  const registry = getAuthRegistry();
  const permissions = new Set<Permission>();
  for (const priv of held) {
    if (isKibanaPrivilege(priv)) {
      const perms = registry.kibanaPrivilegeMap.get(priv) ?? [];
      for (const perm of perms) permissions.add(perm as Permission);
    }
  }

  cacheSet(token, permissions);

  return {
    permissions,
    isAuthenticated: true,
  };
};
