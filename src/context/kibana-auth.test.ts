import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { _clearPermissionCache, kibanaAuthorisationContext } from './kibana-auth';

import { PERMISSIONS, installAuthRegistry } from '@core/auth';
import { galaxySearchAuth } from '@core/modules/galaxySearch/permissions';
import { marketAuth, PERMISSIONS as MARKET_PERMISSIONS } from '@core/modules/market/permissions';
import { sessionsAuth } from '@core/modules/legends-gql-modules/sessions/permissions';
import {
  transactionsAuth,
  PERMISSIONS as TRANSACTIONS_PERMISSIONS,
} from '@core/modules/legends-gql-modules/transactions/permissions';
import {
  tradeAnalysisAuth,
  PERMISSIONS as TRADE_ANALYSIS_PERMISSIONS,
} from '@core/modules/legends-gql-modules/tradeAnalysis/permissions';

vi.mock('../config', () => ({
  ELASTIC_SEARCH_URL: 'http://elastic.test/',
  ELASTIC_KIBANA_INDEX: '.kibana',
  ELASTIC_REQUIRED_PRIVILEGE: 'feature_galaxySearch.all',
}));

beforeAll(() => {
  installAuthRegistry([galaxySearchAuth, marketAuth, sessionsAuth, transactionsAuth, tradeAnalysisAuth]);
});
afterAll(() => {
  installAuthRegistry([]);
});

type FetchResponse = { ok: boolean; status?: number; json?: () => Promise<unknown> };

const mockFetch = (response: FetchResponse) => {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response as unknown as Response);
};

const makeParams = (token: string | undefined) =>
  ({
    req: { headers: { authorization: token } },
  }) as Parameters<typeof kibanaAuthorisationContext>[0];

const elasticResponse = (heldPrivileges: string[]) => ({
  ok: true,
  status: 200,
  json: () =>
    Promise.resolve({
      application: {
        'kibana-.kibana': {
          '*': Object.fromEntries(
            [
              'feature_galaxySearch.all',
              'feature_galaxySearch.read',
              'feature_logSearch.read',
              'feature_sessionListings.read',
              'feature_coalitionListings.read',
              'feature_tradeListings.read',
              'feature_tradeListings.all',
              'feature_resourceListings.read',
              'feature_marketListings.read',
            ].map(p => [p, heldPrivileges.includes(p)])
          ),
        },
      },
    }),
});

beforeEach(() => {
  _clearPermissionCache();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('kibanaAuthorisationContext - authentication', () => {
  it('returns unauthenticated when no authorization header is present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await kibanaAuthorisationContext(makeParams(undefined));
    expect(result).toEqual({ isAuthenticated: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws when Elastic reports the gate privilege is missing', async () => {
    mockFetch(elasticResponse(['feature_logSearch.read'])); // no gate privilege
    await expect(kibanaAuthorisationContext(makeParams('Bearer t1'))).rejects.toThrow(/Incorrect authorization/);
  });

  it('throws when fetch rejects (Elastic unreachable)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(kibanaAuthorisationContext(makeParams('Bearer t1'))).rejects.toThrow(
      /Error while confirming authorization/
    );
  });

  it('throws when Elastic returns a non-2xx', async () => {
    mockFetch({ ok: false, status: 503, json: () => Promise.resolve({}) });
    await expect(kibanaAuthorisationContext(makeParams('Bearer t1'))).rejects.toThrow(
      /Error while confirming authorization/
    );
  });
});

describe('kibanaAuthorisationContext - permission set construction', () => {
  it('grants the union of permissions for all held privileges', async () => {
    mockFetch(elasticResponse(['feature_galaxySearch.all', 'feature_marketListings.read']));
    const result = await kibanaAuthorisationContext(makeParams('Bearer t1'));
    expect(result.isAuthenticated).toBe(true);
    expect(result.permissions).toEqual(
      new Set([MARKET_PERMISSIONS.MARKET_READ, PERMISSIONS.OBJECTS_READ])
      // Note: gate privilege feature_galaxySearch.all is held but not in the map,
      // so no extra permissions from it (galaxySearch.read is what grants SEARCH_READ).
    );
  });

  it('grants the gate privilege without conferring extra permissions', async () => {
    mockFetch(elasticResponse(['feature_galaxySearch.all']));
    const result = await kibanaAuthorisationContext(makeParams('Bearer t1'));
    expect(result.permissions).toEqual(new Set());
    expect(result.isAuthenticated).toBe(true);
  });

  it('grants TRADE_ANALYSIS_LABEL only when feature_tradeListings.all is held', async () => {
    mockFetch(elasticResponse(['feature_galaxySearch.all', 'feature_tradeListings.read']));
    const readOnly = await kibanaAuthorisationContext(makeParams('Bearer t-readonly'));
    expect(readOnly.permissions?.has(TRADE_ANALYSIS_PERMISSIONS.TRADE_ANALYSIS_LABEL)).toBe(false);
    expect(readOnly.permissions?.has(TRADE_ANALYSIS_PERMISSIONS.TRADE_ANALYSIS_READ)).toBe(true);
    expect(readOnly.permissions?.has(TRANSACTIONS_PERMISSIONS.TRANSACTIONS_READ)).toBe(true);

    _clearPermissionCache();
    mockFetch(elasticResponse(['feature_galaxySearch.all', 'feature_tradeListings.read', 'feature_tradeListings.all']));
    const labeller = await kibanaAuthorisationContext(makeParams('Bearer t-labeller'));
    expect(labeller.permissions?.has(TRADE_ANALYSIS_PERMISSIONS.TRADE_ANALYSIS_LABEL)).toBe(true);
  });

  it('probes all mapped privileges (and the gate) in a single request', async () => {
    const fetchSpy = mockFetch(elasticResponse(['feature_galaxySearch.all']));
    await kibanaAuthorisationContext(makeParams('Bearer t1'));

    expect(fetchSpy).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    const probed = body.application[0].privileges as string[];
    expect(probed).toContain('feature_galaxySearch.all'); // gate
    expect(probed).toContain('feature_marketListings.read');
    expect(probed).toContain('feature_tradeListings.all');
    // No duplicates
    expect(new Set(probed).size).toBe(probed.length);
  });
});

describe('kibanaAuthorisationContext - cache', () => {
  it('serves a second request for the same token from cache (no Elastic call)', async () => {
    const fetchSpy = mockFetch(elasticResponse(['feature_galaxySearch.all', 'feature_marketListings.read']));
    const first = await kibanaAuthorisationContext(makeParams('Bearer t1'));
    const second = await kibanaAuthorisationContext(makeParams('Bearer t1'));

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(second.permissions).toEqual(first.permissions);
  });

  it('re-fetches after TTL expiry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const fetchSpy = mockFetch(elasticResponse(['feature_galaxySearch.all']));
    await kibanaAuthorisationContext(makeParams('Bearer t1'));
    expect(fetchSpy).toHaveBeenCalledOnce();

    // Within TTL: cached
    vi.advanceTimersByTime(29_000);
    await kibanaAuthorisationContext(makeParams('Bearer t1'));
    expect(fetchSpy).toHaveBeenCalledOnce();

    // Past TTL: re-fetch
    vi.advanceTimersByTime(2_000);
    await kibanaAuthorisationContext(makeParams('Bearer t1'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not cross-pollinate between tokens', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(elasticResponse(['feature_galaxySearch.all', 'feature_marketListings.read']) as never)
      .mockResolvedValueOnce(elasticResponse(['feature_galaxySearch.all', 'feature_logSearch.read']) as never);

    const a = await kibanaAuthorisationContext(makeParams('Bearer tokenA'));
    const b = await kibanaAuthorisationContext(makeParams('Bearer tokenB'));

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(a.permissions?.has(MARKET_PERMISSIONS.MARKET_READ)).toBe(true);
    expect(a.permissions?.has(PERMISSIONS.LOGINS_READ)).toBe(false);
    expect(b.permissions?.has(PERMISSIONS.LOGINS_READ)).toBe(true);
    expect(b.permissions?.has(MARKET_PERMISSIONS.MARKET_READ)).toBe(false);
  });

  it('does not cache failures (gate privilege missing)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(elasticResponse(['feature_logSearch.read']) as never) // no gate
      .mockResolvedValueOnce(elasticResponse(['feature_galaxySearch.all']) as never);

    await expect(kibanaAuthorisationContext(makeParams('Bearer t1'))).rejects.toThrow();
    const result = await kibanaAuthorisationContext(makeParams('Bearer t1'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.isAuthenticated).toBe(true);
  });
});
