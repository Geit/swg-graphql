import { describe, expect, it } from 'vitest';

import { KIBANA_PRIVILEGE_TO_PERMISSIONS } from './kibanaPrivilegeMap';
import { PERMISSIONS } from './permissions';
import { isKibanaPrivilege, isPermission } from './registry';

describe('KIBANA_PRIVILEGE_TO_PERMISSIONS', () => {
  it('every mapped privilege grants only known permissions', () => {
    // Guards against typos that would otherwise become silent dead entries
    for (const [priv, perms] of Object.entries(KIBANA_PRIVILEGE_TO_PERMISSIONS)) {
      for (const perm of perms) {
        expect(isPermission(perm), `${priv} grants unknown permission "${perm}"`).toBe(true);
      }
    }
  });

  it('matches the expected core mapping (snapshot to catch accidental expansion)', () => {
    // Any change here is a deliberate privilege-grant change and needs review.
    expect(KIBANA_PRIVILEGE_TO_PERMISSIONS).toEqual({
      'feature_logSearch.read': [PERMISSIONS.LOGINS_READ],
      'feature_coalitionListings.read': [PERMISSIONS.GUILDS_READ, PERMISSIONS.CITIES_READ, PERMISSIONS.OBJECTS_READ],
      'feature_resourceListings.read': [PERMISSIONS.RESOURCES_READ],
    });
  });
});

describe('isKibanaPrivilege', () => {
  it('accepts every core mapped key', () => {
    for (const key of Object.keys(KIBANA_PRIVILEGE_TO_PERMISSIONS)) {
      expect(isKibanaPrivilege(key)).toBe(true);
    }
  });

  it('rejects the gate privilege and arbitrary strings', () => {
    expect(isKibanaPrivilege('login:')).toBe(false);
    expect(isKibanaPrivilege('feature_does_not_exist.read')).toBe(false);
    expect(isKibanaPrivilege('')).toBe(false);
  });
});
