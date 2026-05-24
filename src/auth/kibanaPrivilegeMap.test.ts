import { describe, expect, it } from 'vitest';

import { isKibanaPrivilege, KIBANA_PRIVILEGE_TO_PERMISSIONS } from './kibanaPrivilegeMap';
import { isPermission, PERMISSIONS } from './permissions';

describe('KIBANA_PRIVILEGE_TO_PERMISSIONS', () => {
  it('every mapped privilege grants only known permissions', () => {
    // Guards against typos that would otherwise become silent dead entries
    for (const [priv, perms] of Object.entries(KIBANA_PRIVILEGE_TO_PERMISSIONS)) {
      for (const perm of perms) {
        expect(isPermission(perm), `${priv} grants unknown permission "${perm}"`).toBe(true);
      }
    }
  });

  it('matches the expected mapping (snapshot to catch accidental expansion)', () => {
    // Any change here is a deliberate privilege-grant change and needs review.
    expect(KIBANA_PRIVILEGE_TO_PERMISSIONS).toEqual({
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
    });
  });

  it('TRADE_ANALYSIS_LABEL (write) is gated only by feature_tradeListings.all', () => {
    // Write permissions must not be reachable from any *.read privilege
    for (const [priv, perms] of Object.entries(KIBANA_PRIVILEGE_TO_PERMISSIONS)) {
      if (priv.endsWith('.read')) {
        expect(perms, `${priv} must not grant TRADE_ANALYSIS_LABEL`).not.toContain(PERMISSIONS.TRADE_ANALYSIS_LABEL);
      }
    }
    expect(KIBANA_PRIVILEGE_TO_PERMISSIONS['feature_tradeListings.all']).toContain(PERMISSIONS.TRADE_ANALYSIS_LABEL);
  });
});

describe('isKibanaPrivilege', () => {
  it('accepts every mapped key', () => {
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
