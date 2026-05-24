import { AuthCheckerFn, ResolverData } from 'type-graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { customAuthChecker as rawCustomAuthChecker } from './authorizationGuard';
import { PERMISSIONS, Permission } from './permissions';

import { ContextType } from '@core/context/types';

// type-graphql's AuthChecker is a union of (fn | class); narrow to the fn form for the tests.
const customAuthChecker = rawCustomAuthChecker as AuthCheckerFn<ContextType>;

const makeResolverData = (context: ContextType): ResolverData<ContextType> =>
  ({ context }) as ResolverData<ContextType>;

const ctx = (overrides: Partial<ContextType> = {}): ContextType => ({
  isAuthenticated: true,
  permissions: new Set<Permission>(),
  ...overrides,
});

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

describe('customAuthChecker', () => {
  it('allows authenticated requests when no permissions are required', () => {
    const result = customAuthChecker(makeResolverData(ctx({ permissions: new Set() })), []);
    expect(result).toBe(true);
  });

  it('rejects unauthenticated requests even when no permissions are required', () => {
    const result = customAuthChecker(makeResolverData(ctx({ isAuthenticated: false })), []);
    expect(result).toBe(false);
  });

  it('allows when the context holds the single required permission', () => {
    const result = customAuthChecker(makeResolverData(ctx({ permissions: new Set([PERMISSIONS.OBJECTS_READ]) })), [
      PERMISSIONS.OBJECTS_READ,
    ]);
    expect(result).toBe(true);
  });

  it('allows when the context holds ALL required permissions', () => {
    const result = customAuthChecker(
      makeResolverData(ctx({ permissions: new Set([PERMISSIONS.OBJECTS_READ, PERMISSIONS.ACCOUNTS_READ]) })),
      [PERMISSIONS.OBJECTS_READ, PERMISSIONS.ACCOUNTS_READ]
    );
    expect(result).toBe(true);
  });

  it('rejects when the context is missing any required permission (AND semantics)', () => {
    const result = customAuthChecker(makeResolverData(ctx({ permissions: new Set([PERMISSIONS.OBJECTS_READ]) })), [
      PERMISSIONS.OBJECTS_READ,
      PERMISSIONS.ACCOUNTS_READ,
    ]);
    expect(result).toBe(false);
  });

  it('rejects when permissions Set is undefined and any permission is required', () => {
    const result = customAuthChecker(makeResolverData(ctx({ permissions: undefined })), [PERMISSIONS.OBJECTS_READ]);
    expect(result).toBe(false);
  });

  it('logs a rejection with the required and held permissions', () => {
    const infoSpy = vi.mocked(console.info);
    infoSpy.mockClear();
    customAuthChecker(makeResolverData(ctx({ permissions: new Set([PERMISSIONS.OBJECTS_READ]) })), [
      PERMISSIONS.ACCOUNTS_READ,
    ]);
    expect(infoSpy).toHaveBeenCalledOnce();
    const [payload, message] = infoSpy.mock.calls[0];
    expect(message).toBe('Authorization for user rejected');
    expect(payload).toMatchObject({
      hasAllPermissions: false,
      hasPermissionsRequired: true,
      permissionsRequired: [PERMISSIONS.ACCOUNTS_READ],
    });
  });
});
