import path from 'path';
import { readFileSync } from 'fs';

import { SWGGraphqlContextFunction } from './types';

import { expandRoles, isPermission, isRoleName, Permission, RoleName } from '@core/auth';

interface ApiKeysDocument {
  enabled: boolean;
  roles?: string[];
  permissions?: string[];
}

interface ValidatedApiKey {
  enabled: boolean;
  roles: readonly RoleName[];
  permissions: readonly Permission[];
}

export const API_KEY_PREFIX = 'ApiKey-';
const serverConfigFile = path.join(__dirname, '../../data/api-keys.json');

const validateApiKeys = (raw: Record<string, ApiKeysDocument | undefined>): Record<string, ValidatedApiKey> => {
  const validated: Record<string, ValidatedApiKey> = {};
  const errors: string[] = [];

  for (const [keyId, entry] of Object.entries(raw)) {
    if (!entry) continue;

    const unknownRoles = (entry.roles ?? []).filter((r): r is string => !isRoleName(r));
    const unknownPermissions = (entry.permissions ?? []).filter(p => !isPermission(p));

    if (unknownRoles.length > 0) {
      errors.push(`api-keys.json: key "${keyId}" references unknown role(s): ${unknownRoles.join(', ')}`);
    }
    if (unknownPermissions.length > 0) {
      errors.push(`api-keys.json: key "${keyId}" references unknown permission(s): ${unknownPermissions.join(', ')}`);
    }

    validated[keyId] = {
      enabled: entry.enabled,
      roles: (entry.roles ?? []).filter(isRoleName),
      permissions: (entry.permissions ?? []).filter(isPermission),
    };
  }

  if (errors.length > 0) {
    throw new Error(`Invalid api-keys configuration:\n  ${errors.join('\n  ')}`);
  }

  return validated;
};

export const _validateApiKeys = validateApiKeys;

// Deferred to `loadApiKeys()` because validation depends on the auth registry being installed
// (module-contributed permissions must be recognised before they can pass `isPermission`).
let apiKeys: Record<string, ValidatedApiKey> = {};

export const loadApiKeys = (): void => {
  apiKeys = validateApiKeys(JSON.parse(readFileSync(serverConfigFile, { encoding: 'ascii' })));
};

// eslint-disable-next-line require-await
export const apiKeyAuth: SWGGraphqlContextFunction = async params => {
  if (!params.req.headers.authorization) {
    return {
      isAuthenticated: false,
    };
  }

  const apiKey = apiKeys[params.req.headers.authorization.slice(API_KEY_PREFIX.length)];

  if (!apiKey || !apiKey.enabled) {
    return {
      isAuthenticated: false,
    };
  }

  const permissions = expandRoles(apiKey.roles);
  for (const perm of apiKey.permissions) permissions.add(perm);

  return {
    permissions,
    isAuthenticated: true,
  };
};
