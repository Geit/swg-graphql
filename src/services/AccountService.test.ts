import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AccountService } from './AccountService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

// Mock the config module
vi.mock('../config', () => ({
  STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL: 'http://example.com/account/{STATION_ID}',
}));

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(() => {
    tracker.reset();
    service = new AccountService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllCharactersForAccount', () => {
    it('should query SWG_CHARACTERS with station ID', async () => {
      const mockCharacters = [{ OBJECT_ID: 12345 }, { OBJECT_ID: 67890 }];
      tracker.on.select('SWG_CHARACTERS').response(mockCharacters);

      const result = await service.getAllCharactersForAccount(1001);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('SWG_CHARACTERS');
      expect(query.sql).toContain('CLUSTER_LIST');
      expect(query.bindings).toContain(1001);
      expect(result).toEqual(mockCharacters);
    });

    it('should return empty array when no characters found', async () => {
      tracker.on.select('SWG_CHARACTERS').response([]);

      const result = await service.getAllCharactersForAccount(9999);

      expect(result).toEqual([]);
    });
  });

  describe('getAllOneTimeEvents', () => {
    it('should query ACCOUNT_REWARD_EVENTS and transform results', async () => {
      const mockDate = new Date('2024-01-15');
      const mockEvents = [
        {
          STATION_ID: 1001,
          EVENT_ID: 'event_123',
          DATE_CONSUMED: mockDate,
          CLUSTER_ID: 5,
          CHARACTER_ID: 12345,
        },
      ];
      tracker.on.select('ACCOUNT_REWARD_EVENTS').response(mockEvents);

      const result = await service.getAllOneTimeEvents(1001);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('ACCOUNT_REWARD_EVENTS');
      expect(query.bindings).toContain(1001);
      expect(result).toEqual([
        {
          type: 'event',
          stationId: 1001,
          eventId: 'event_123',
          dateConsumed: mockDate,
          clusterId: 5,
          characterId: 12345,
        },
      ]);
    });

    it('should return empty array when no events found', async () => {
      tracker.on.select('ACCOUNT_REWARD_EVENTS').response([]);

      const result = await service.getAllOneTimeEvents(9999);

      expect(result).toEqual([]);
    });
  });

  describe('getAllOneTimeItems', () => {
    it('should query ACCOUNT_REWARD_ITEMS and transform results', async () => {
      const mockDate = new Date('2024-02-20');
      const mockItems = [
        {
          STATION_ID: 1001,
          ITEM_ID: 'item_456',
          DATE_CLAIMED: mockDate,
          CLUSTER_ID: 3,
          CHARACTER_ID: 54321,
        },
      ];
      tracker.on.select('ACCOUNT_REWARD_ITEMS').response(mockItems);

      const result = await service.getAllOneTimeItems(1001);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('ACCOUNT_REWARD_ITEMS');
      expect(query.bindings).toContain(1001);
      expect(result).toEqual([
        {
          type: 'item',
          stationId: 1001,
          itemId: 'item_456',
          dateConsumed: mockDate,
          clusterId: 3,
          characterId: 54321,
        },
      ]);
    });

    it('should return empty array when no items found', async () => {
      tracker.on.select('ACCOUNT_REWARD_ITEMS').response([]);

      const result = await service.getAllOneTimeItems(9999);

      expect(result).toEqual([]);
    });
  });

  describe('getAccountNameFromStationId', () => {
    it('should fetch account name from external service', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve('TestAccount'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.getAccountNameFromStationId(1001);

      expect(mockFetch).toHaveBeenCalledWith('http://example.com/account/1001');
      expect(result).toBe('TestAccount');
    });

    it('should return null when service returns NULL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve('NULL'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await service.getAccountNameFromStationId(2002);

      expect(result).toBeNull();
    });

    it('should cache results for same station ID', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve('CachedAccount'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result1 = await service.getAccountNameFromStationId(3003);
      const result2 = await service.getAccountNameFromStationId(3003);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe('CachedAccount');
      expect(result2).toBe('CachedAccount');
    });

    it('should make separate requests for different station IDs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve('Account'),
      });
      vi.stubGlobal('fetch', mockFetch);

      await service.getAccountNameFromStationId(4004);
      await service.getAccountNameFromStationId(5005);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('http://example.com/account/4004');
      expect(mockFetch).toHaveBeenCalledWith('http://example.com/account/5005');
    });
  });
});

describe('AccountService without URL configured', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return null when STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL is not set', async () => {
    vi.doMock('../config', () => ({
      STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL: '',
    }));

    vi.doMock('./db');

    const { AccountService: FreshAccountService } = await import('./AccountService');
    const service = new FreshAccountService();

    const result = service.getAccountNameFromStationId(1001);

    expect(result).toBeNull();
  });
});
