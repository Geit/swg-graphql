import { describe, expect, it } from 'vitest';

import { ALL_PERMISSIONS, PERMISSIONS } from './permissions';
import { expandRoles, isRoleName, ROLE_BUNDLES } from './roleBundles';

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
  it('csrReadonly contains read-only permissions and does not contain TRADE_ANALYSIS_LABEL', () => {
    expect(ROLE_BUNDLES.csrReadonly).not.toContain(PERMISSIONS.TRADE_ANALYSIS_LABEL);
    expect(ROLE_BUNDLES.csrReadonly).toContain(PERMISSIONS.OBJECTS_READ);
    expect(ROLE_BUNDLES.csrReadonly).toContain(PERMISSIONS.MARKET_READ);
  });

  it('csrAnalyst extends csrReadonly with the label-write permission', () => {
    for (const perm of ROLE_BUNDLES.csrReadonly) {
      expect(ROLE_BUNDLES.csrAnalyst).toContain(perm);
    }
    expect(ROLE_BUNDLES.csrAnalyst).toContain(PERMISSIONS.TRADE_ANALYSIS_LABEL);
  });

  it('admin grants every defined permission', () => {
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

  it('deduplicates overlapping permissions across multiple roles', () => {
    const both = expandRoles(['csrReadonly', 'csrAnalyst']);
    // csrAnalyst is a superset of csrReadonly, so the union equals csrAnalyst
    expect(both).toEqual(new Set(ROLE_BUNDLES.csrAnalyst));
  });

  it('returns a fresh Set per call (no shared mutable state)', () => {
    const a = expandRoles(['csrReadonly']);
    const b = expandRoles(['csrReadonly']);
    expect(a).not.toBe(b);
    a.add(PERMISSIONS.TRADE_ANALYSIS_LABEL);
    expect(b.has(PERMISSIONS.TRADE_ANALYSIS_LABEL)).toBe(false);
  });
});
