import { afterEach, describe, expect, it } from 'vitest';

import { PERMISSIONS } from './permissions';
import {
  AuthContribution,
  expandRoles,
  getAuthRegistry,
  installAuthRegistry,
  isKibanaPrivilege,
  isPermission,
} from './registry';

afterEach(() => {
  installAuthRegistry([]);
});

describe('installAuthRegistry', () => {
  it('merges module-contributed permissions into the recognised set', () => {
    const contrib: AuthContribution = { permissions: ['demo:read', 'demo:write'] };
    installAuthRegistry([contrib]);

    expect(isPermission('demo:read')).toBe(true);
    expect(isPermission('demo:write')).toBe(true);
    expect(isPermission(PERMISSIONS.OBJECTS_READ)).toBe(true);
    expect(isPermission('unknown:perm')).toBe(false);
  });

  it('adds contributed perms to the named role bundles', () => {
    const contrib: AuthContribution = {
      permissions: ['demo:read'],
      roleContributions: { csrReadonly: ['demo:read'] },
    };
    installAuthRegistry([contrib]);

    const csrReadonly = expandRoles(['csrReadonly']);
    expect(csrReadonly.has('demo:read')).toBe(true);
    expect(csrReadonly.has(PERMISSIONS.OBJECTS_READ)).toBe(true);
  });

  it('admin always grants every registered permission, including module contributions', () => {
    const contrib: AuthContribution = { permissions: ['demo:label'] };
    installAuthRegistry([contrib]);

    const admin = expandRoles(['admin']);
    expect(admin.has('demo:label')).toBe(true);
    expect(admin.has(PERMISSIONS.OBJECTS_READ)).toBe(true);
  });

  it('array-merges multiple contributions to the same Kibana privilege key', () => {
    installAuthRegistry([
      { kibanaPrivileges: { 'feature_shared.read': ['perm:a', 'perm:b'] } },
      { kibanaPrivileges: { 'feature_shared.read': ['perm:c'] } },
    ]);

    const merged = getAuthRegistry().kibanaPrivilegeMap.get('feature_shared.read');
    expect(merged).toEqual(['perm:a', 'perm:b', 'perm:c']);
    expect(isKibanaPrivilege('feature_shared.read')).toBe(true);
  });

  it('exposes the merged list of privileges to probe (no duplicates)', () => {
    installAuthRegistry([
      { kibanaPrivileges: { 'feature_a.read': ['perm:1'] } },
      { kibanaPrivileges: { 'feature_a.read': ['perm:2'], 'feature_b.read': ['perm:3'] } },
    ]);

    const probe = getAuthRegistry().privilegesToProbe;
    expect(new Set(probe).size).toBe(probe.length);
    expect(probe).toContain('feature_a.read');
    expect(probe).toContain('feature_b.read');
  });

  it('replaces (not appends to) previous contributions on re-install', () => {
    installAuthRegistry([{ permissions: ['demo:first'] }]);
    expect(isPermission('demo:first')).toBe(true);

    installAuthRegistry([{ permissions: ['demo:second'] }]);
    expect(isPermission('demo:first')).toBe(false);
    expect(isPermission('demo:second')).toBe(true);
  });
});
