import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Account } from '../types';

import { RootResolver } from './RootResolver';

describe('RootResolver', () => {
  let resolver: RootResolver;
  let mockObjectService: { getOne: ReturnType<typeof vi.fn>; getMany: ReturnType<typeof vi.fn> };
  let mockResourceTypeService: {
    countMany: ReturnType<typeof vi.fn>;
    getMany: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
  };
  let mockPlayerCreatureService: { getRecentlyLoggedInCharacters: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
      getMany: vi.fn().mockResolvedValue([]),
    };

    mockResourceTypeService = {
      countMany: vi.fn().mockResolvedValue(0),
      getMany: vi.fn().mockResolvedValue([]),
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockPlayerCreatureService = {
      getRecentlyLoggedInCharacters: vi.fn().mockResolvedValue([]),
    };

    resolver = new RootResolver();
    // Inject mocks
    (resolver as unknown as { objectService: typeof mockObjectService }).objectService = mockObjectService;
    (resolver as unknown as { resourceTypeService: typeof mockResourceTypeService }).resourceTypeService =
      mockResourceTypeService;
    (resolver as unknown as { playerCreatureService: typeof mockPlayerCreatureService }).playerCreatureService =
      mockPlayerCreatureService;
  });

  describe('object', () => {
    it('should fetch object by id', async () => {
      const mockObject = { id: '12345', name: 'Test Object' };
      mockObjectService.getOne.mockResolvedValue(mockObject);

      const result = await resolver.object('12345');

      expect(mockObjectService.getOne).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockObject);
    });
  });

  describe('objects', () => {
    it('should fetch objects with default options', async () => {
      const mockObjects = [{ id: '111' }, { id: '222' }];
      mockObjectService.getMany.mockResolvedValue(mockObjects);

      const result = await resolver.objects(50, false);

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        searchText: undefined,
        limit: 50,
        excludeDeleted: false,
        objectIds: undefined,
        loadsWithIds: undefined,
        containedByIdRecursive: undefined,
      });
      expect(result).toEqual(mockObjects);
    });

    it('should pass optional filters', async () => {
      mockObjectService.getMany.mockResolvedValue([]);

      await resolver.objects(10, true, ['111', '222'], ['333'], '444', 'search text');

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        searchText: 'search text',
        limit: 10,
        excludeDeleted: true,
        objectIds: ['111', '222'],
        loadsWithIds: ['333'],
        containedByIdRecursive: '444',
      });
    });
  });

  describe('account', () => {
    it('should return account object with station id', () => {
      const result = resolver.account('12345');

      expect(result).toBeInstanceOf(Account);
      expect(result.id).toBe(12345);
    });
  });

  describe('resources', () => {
    it('should fetch resources with pagination', async () => {
      const mockResources = [{ id: '1', name: 'Iron' }];
      mockResourceTypeService.countMany.mockResolvedValue(100);
      mockResourceTypeService.getMany.mockResolvedValue(mockResources);

      const result = await resolver.resources(50, 0);

      expect(mockResourceTypeService.countMany).toHaveBeenCalledWith({ limit: 50, offset: 0 });
      expect(mockResourceTypeService.getMany).toHaveBeenCalledWith({ limit: 50, offset: 0 });
      expect(result).toEqual({
        totalResults: 100,
        results: mockResources,
      });
    });
  });

  describe('resource', () => {
    it('should fetch single resource by id', async () => {
      const mockResource = { id: '12345', name: 'Iron' };
      mockResourceTypeService.getOne.mockResolvedValue(mockResource);

      const result = await resolver.resource('12345');

      expect(mockResourceTypeService.getOne).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockResource);
    });
  });

  describe('recentLogins', () => {
    it('should fetch recent logins with pagination', async () => {
      const mockPlayers = [{ CHARACTER_OBJECT: 111 }, { CHARACTER_OBJECT: 222 }];
      const mockObjects = [{ id: '111' }, { id: '222' }];

      mockPlayerCreatureService.getRecentlyLoggedInCharacters.mockResolvedValue(mockPlayers);
      mockObjectService.getMany.mockResolvedValue(mockObjects);

      const result = await resolver.recentLogins(1000, 0, 600);

      expect(mockPlayerCreatureService.getRecentlyLoggedInCharacters).toHaveBeenCalledWith(600);
      expect(result.totalResults).toBe(2);
      expect(result.results).toEqual(mockObjects);
    });

    it('should throw error for invalid limit', async () => {
      await expect(resolver.recentLogins(2000, 0, 600)).rejects.toThrow('Bad `limit` argument');
      await expect(resolver.recentLogins(-1, 0, 600)).rejects.toThrow('Bad `limit` argument');
    });

    it('should throw error for invalid offset', async () => {
      await expect(resolver.recentLogins(100, -1, 600)).rejects.toThrow('Bad `offset` argument');
    });

    it('should apply offset correctly', async () => {
      const mockPlayers = [{ CHARACTER_OBJECT: 111 }, { CHARACTER_OBJECT: 222 }, { CHARACTER_OBJECT: 333 }];
      mockPlayerCreatureService.getRecentlyLoggedInCharacters.mockResolvedValue(mockPlayers);
      mockObjectService.getMany.mockResolvedValue([{ id: '222' }]);

      const result = await resolver.recentLogins(1, 1, 600);

      expect(result.totalResults).toBe(3);
      expect(mockObjectService.getMany).toHaveBeenCalledWith(
        expect.objectContaining({
          objectIds: ['222'],
        })
      );
    });
  });
});
