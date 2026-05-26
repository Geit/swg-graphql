import { describe, expect, it, vi } from 'vitest';

// Importing the module after the mock means readFileSync is harmless at load time.
import { _validateApiKeys } from './api-key-auth';

vi.mock('fs', () => ({
  readFileSync: vi.fn(() => '{}'),
}));

describe('_validateApiKeys', () => {
  it('accepts a key with only known roles', () => {
    const result = _validateApiKeys({
      key1: { enabled: true, roles: ['csrReadonly'] },
    });
    expect(result.key1).toEqual({
      enabled: true,
      roles: ['csrReadonly'],
      permissions: [],
    });
  });

  it('accepts a key with only known permissions', () => {
    const result = _validateApiKeys({
      key1: { enabled: true, permissions: ['objects:read'] },
    });
    expect(result.key1).toEqual({
      enabled: true,
      roles: [],
      permissions: ['objects:read'],
    });
  });

  it('accepts roles and permissions together', () => {
    const result = _validateApiKeys({
      key1: { enabled: true, roles: ['csrReadonly'], permissions: ['objects:read'] },
    });
    expect(result.key1.roles).toEqual(['csrReadonly']);
    expect(result.key1.permissions).toEqual(['objects:read']);
  });

  it('throws on an unknown role', () => {
    expect(() =>
      _validateApiKeys({
        key1: { enabled: true, roles: ['csrReadOnly'] }, // common typo: capital O
      })
    ).toThrowError(/unknown role.*csrReadOnly/);
  });

  it('throws on an unknown permission', () => {
    expect(() =>
      _validateApiKeys({
        key1: { enabled: true, permissions: ['objects:reed'] }, // typo
      })
    ).toThrowError(/unknown permission.*objects:reed/);
  });

  it('accepts permissions contributed by a module after its registry is installed', async () => {
    const { installAuthRegistry } = await import('@core/auth');
    const { tradeAnalysisAuth } = await import('@core/modules/legends-gql-modules/tradeAnalysis/permissions');
    installAuthRegistry([tradeAnalysisAuth]);
    try {
      const result = _validateApiKeys({
        key1: { enabled: true, permissions: ['tradeAnalysis:label'] },
      });
      expect(result.key1.permissions).toEqual(['tradeAnalysis:label']);
    } finally {
      installAuthRegistry([]);
    }
  });

  it('throws once with all errors aggregated across keys', () => {
    expect(() =>
      _validateApiKeys({
        key1: { enabled: true, roles: ['badRole'] },
        key2: { enabled: true, permissions: ['badPerm'] },
      })
    ).toThrowError(/key1.*badRole[\s\S]*key2.*badPerm/);
  });

  it('throws even when the offending key is disabled', () => {
    // Disabled keys still get validated so the file is always known-good
    expect(() =>
      _validateApiKeys({
        key1: { enabled: false, roles: ['badRole'] },
      })
    ).toThrowError(/unknown role.*badRole/);
  });

  it('handles missing roles/permissions fields (defaults to empty arrays)', () => {
    const result = _validateApiKeys({
      key1: { enabled: true },
    });
    expect(result.key1).toEqual({
      enabled: true,
      roles: [],
      permissions: [],
    });
  });

  it('skips undefined entries without throwing', () => {
    const result = _validateApiKeys({
      key1: undefined,
    });
    expect(result.key1).toBeUndefined();
  });
});
