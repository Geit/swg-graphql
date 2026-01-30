import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AccountService } from '../services/AccountService';
import { DataTableService } from '../services/DataTableService';
import { PlayerCreatureObjectService } from '../services/PlayerCreatureObjectService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { Account } from '../types';

import { AccountResolver } from './AccountResolver';

describe('AccountResolver', () => {
  let resolver: AccountResolver;
  let mockAccountService: {
    getAllCharactersForAccount: ReturnType<typeof vi.fn>;
    getAccountNameFromStationId: ReturnType<typeof vi.fn>;
    getAllOneTimeEvents: ReturnType<typeof vi.fn>;
    getAllOneTimeItems: ReturnType<typeof vi.fn>;
  };
  let mockObjectService: { getOne: ReturnType<typeof vi.fn>; getMany: ReturnType<typeof vi.fn> };
  let mockDataTableService: { load: ReturnType<typeof vi.fn> };
  let mockStringService: { load: ReturnType<typeof vi.fn> };
  let mockPlayerCreatureService: { getCheapStructuresForCharacter: ReturnType<typeof vi.fn> };

  const createMockAccount = (id: number): Account => {
    const account = new Account();
    account.id = id;
    return account;
  };

  beforeEach(() => {
    mockAccountService = {
      getAllCharactersForAccount: vi.fn().mockResolvedValue([]),
      getAccountNameFromStationId: vi.fn().mockResolvedValue(null),
      getAllOneTimeEvents: vi.fn().mockResolvedValue([]),
      getAllOneTimeItems: vi.fn().mockResolvedValue([]),
    };

    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
      getMany: vi.fn().mockResolvedValue([]),
    };

    mockDataTableService = {
      load: vi.fn().mockResolvedValue([]),
    };

    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    mockPlayerCreatureService = {
      getCheapStructuresForCharacter: vi.fn().mockResolvedValue([]),
    };

    resolver = new AccountResolver(
      mockAccountService as unknown as AccountService,
      mockObjectService as unknown as ServerObjectService,
      mockDataTableService as unknown as DataTableService,
      mockStringService as unknown as StringFileLoader,
      mockPlayerCreatureService as unknown as PlayerCreatureObjectService
    );
  });

  describe('characters', () => {
    it('should fetch characters for account', async () => {
      const mockCharacters = [{ OBJECT_ID: 111 }, { OBJECT_ID: 222 }];
      const mockObjects = [{ id: '111' }, { id: '222' }];

      mockAccountService.getAllCharactersForAccount.mockResolvedValue(mockCharacters);
      mockObjectService.getMany.mockResolvedValue(mockObjects);

      const result = await resolver.characters(createMockAccount(12345), false);

      expect(mockAccountService.getAllCharactersForAccount).toHaveBeenCalledWith(12345);
      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        excludeDeleted: false,
        objectIds: ['111', '222'],
      });
      expect(result).toEqual(mockObjects);
    });

    it('should filter out null characters', async () => {
      const mockCharacters = [{ OBJECT_ID: 111 }, null, { OBJECT_ID: 333 }];
      mockAccountService.getAllCharactersForAccount.mockResolvedValue(mockCharacters);
      mockObjectService.getMany.mockResolvedValue([]);

      await resolver.characters(createMockAccount(12345), true);

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        excludeDeleted: true,
        objectIds: ['111', '333'],
      });
    });
  });

  describe('accountName', () => {
    it('should return account name from service', async () => {
      mockAccountService.getAccountNameFromStationId.mockResolvedValue('TestAccount');

      const result = await resolver.accountName(createMockAccount(12345));

      expect(mockAccountService.getAccountNameFromStationId).toHaveBeenCalledWith(12345);
      expect(result).toBe('TestAccount');
    });
  });

  describe('ownedObjects', () => {
    it('should fetch owned objects for account', async () => {
      const mockCharacters = [{ OBJECT_ID: 111 }];
      const mockObjects = [{ id: '999', name: 'Structure' }];

      mockAccountService.getAllCharactersForAccount.mockResolvedValue(mockCharacters);
      mockObjectService.getMany.mockResolvedValue(mockObjects);

      const result = await resolver.ownedObjects(createMockAccount(12345), null, true, false);

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        ownedBy: ['111'],
        objectTypes: null,
        excludeDeleted: true,
      });
      expect(result).toEqual(mockObjects);
    });

    it('should filter by object types when provided', async () => {
      const mockCharacters = [{ OBJECT_ID: 111 }];
      mockAccountService.getAllCharactersForAccount.mockResolvedValue(mockCharacters);
      mockObjectService.getMany.mockResolvedValue([]);

      await resolver.ownedObjects(createMockAccount(12345), [1, 2, 3], false, false);

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        ownedBy: ['111'],
        objectTypes: [1, 2, 3],
        excludeDeleted: false,
      });
    });
  });

  describe('veteranRewards', () => {
    it('should return empty array when no rewards claimed', async () => {
      mockAccountService.getAllOneTimeEvents.mockResolvedValue([]);
      mockAccountService.getAllOneTimeItems.mockResolvedValue([]);

      const result = await resolver.veteranRewards(createMockAccount(12345));

      expect(result).toEqual([]);
    });

    it('should fetch and enrich veteran rewards', async () => {
      const mockEvent = {
        type: 'event' as const,
        eventId: 'event1',
        characterId: 111,
        dateConsumed: new Date('2024-01-01'),
      };
      const mockItem = {
        type: 'item' as const,
        itemId: 'item1',
        characterId: 222,
        dateConsumed: new Date('2024-01-02'),
      };

      mockAccountService.getAllOneTimeEvents.mockResolvedValue([mockEvent]);
      mockAccountService.getAllOneTimeItems.mockResolvedValue([mockItem]);
      mockDataTableService.load.mockResolvedValue([]);
      mockObjectService.getOne.mockResolvedValue({ id: '111', name: 'Character' });

      const result = await resolver.veteranRewards(createMockAccount(12345));

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('item');
      expect(result[1].type).toBe('event');
    });
  });
});
