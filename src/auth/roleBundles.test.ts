import { describe, expect, it } from 'vitest';

import { ALL_PERMISSIONS, PERMISSIONS } from './permissions';
import { expandRoles } from './registry';
import { isRoleName, ROLE_BUNDLES } from './roleBundles';

describe('isRoleName', () => {
  it('accepts every defined bundle key', () => {
    for (const role of Object.keys(ROLE_BUNDLES)) {
      expect(isRoleName(role)).toBe(true);
    }
  });

  it('rejects unknown role names', () => {
    expect(isRoleName('csrReadOnly')).toBe(false); // common typo: capital O
    expect(isRoleName('superuser')).toBe(false);
    expect(isRoleName('')).toBe(false);
  });
});

describe('ROLE_BUNDLES', () => {
  it('csrReadonly contains the core read-only permissions only', () => {
    expect(ROLE_BUNDLES.csrReadonly).toContain(PERMISSIONS.OBJECTS_READ);
    expect(ROLE_BUNDLES.csrReadonly).toContain(PERMISSIONS.ACCOUNTS_READ);
    expect(ROLE_BUNDLES.csrReadonly).toContain(PERMISSIONS.LOGINS_READ);
    expect(ROLE_BUNDLES.csrReadonly).toContain(PERMISSIONS.GUILDS_READ);
    expect(ROLE_BUNDLES.csrReadonly).toContain(PERMISSIONS.CITIES_READ);
    expect(ROLE_BUNDLES.csrReadonly).toContain(PERMISSIONS.RESOURCES_READ);
  });

  it('csrAnalyst starts equal to csrReadonly before module contributions', () => {
    expect(new Set(ROLE_BUNDLES.csrAnalyst)).toEqual(new Set(ROLE_BUNDLES.csrReadonly));
  });

  it('admin grants every core permission', () => {
    expect([...ROLE_BUNDLES.admin].sort()).toEqual([...ALL_PERMISSIONS].sort());
  });
});

describe('expandRoles', () => {
  it('returns an empty set for an empty role list', () => {
    expect(expandRoles([])).toEqual(new Set());
  });

  it('expands a single role to its bundled permissions', () => {
    const result = expandRoles(['csrReadonly']);
    expect(result).toEqual(new Set(ROLE_BUNDLES.csrReadonly));
  });

  it('returns a fresh Set per call (no shared mutable state)', () => {
    const a = expandRoles(['csrReadonly']);
    const b = expandRoles(['csrReadonly']);
    expect(a).not.toBe(b);
    const c = expandRoles([]);
    c.add(PERMISSIONS.OBJECTS_READ);
    expect(expandRoles([])).toEqual(new Set());
  });
});
