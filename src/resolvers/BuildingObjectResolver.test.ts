import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BuildingObjectService } from '../services/BuildingObjectService';
import { GuildService } from '../services/GuildService';
import { NameResolutionService } from '../services/NameResolutionService';
import { ObjVarService } from '../services/ObjVarService';
import { PropertyListService } from '../services/PropertyListService';
import { ServerObjectService } from '../services/ServerObjectService';
import { IServerObject } from '../types';

import { BuildingObjectResolver } from './BuildingObjectResolver';

describe('BuildingObjectResolver', () => {
  let resolver: BuildingObjectResolver;
  let mockBuildingObjectService: {
    load: ReturnType<typeof vi.fn>;
    fetchObjvarAccessList: ReturnType<typeof vi.fn>;
  };
  let mockNameResolutionService: { resolveName: ReturnType<typeof vi.fn> };
  let mockObjVarService: { getObjVarsForObject: ReturnType<typeof vi.fn> };
  let mockObjectService: { getOne: ReturnType<typeof vi.fn> };
  let mockPropertyListService: { load: ReturnType<typeof vi.fn> };
  let mockGuildService: { getGuild: ReturnType<typeof vi.fn> };

  const createMockObject = (overrides: Partial<IServerObject> = {}): IServerObject =>
    ({
      id: '12345',
      ...overrides,
    }) as IServerObject;

  beforeEach(() => {
    mockBuildingObjectService = {
      load: vi.fn().mockResolvedValue(null),
      fetchObjvarAccessList: vi.fn().mockResolvedValue([]),
    };

    mockNameResolutionService = {
      resolveName: vi.fn().mockResolvedValue('Resolved Name'),
    };

    mockObjVarService = {
      getObjVarsForObject: vi.fn().mockResolvedValue([]),
    };

    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockPropertyListService = {
      load: vi.fn().mockResolvedValue([]),
    };

    mockGuildService = {
      getGuild: vi.fn().mockResolvedValue(null),
    };

    resolver = new BuildingObjectResolver(
      mockBuildingObjectService as unknown as BuildingObjectService,
      mockNameResolutionService as unknown as NameResolutionService,
      mockObjVarService as unknown as ObjVarService,
      mockObjectService as unknown as ServerObjectService,
      mockPropertyListService as unknown as PropertyListService,
      mockGuildService as unknown as GuildService
    );
  });

  describe('maintenanceCost', () => {
    it('should return maintenance cost from loaded object', async () => {
      mockBuildingObjectService.load.mockResolvedValue({ MAINTENANCE_COST: 500 });

      const result = await resolver.maintenanceCost(createMockObject());

      expect(mockBuildingObjectService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(500);
    });

    it('should return null when object not found', async () => {
      mockBuildingObjectService.load.mockResolvedValue(null);

      const result = await resolver.maintenanceCost(createMockObject());

      expect(result).toBeNull();
    });
  });

  describe('timeLastChecked', () => {
    it('should return time last checked from loaded object', async () => {
      const timestamp = 1234567890;
      mockBuildingObjectService.load.mockResolvedValue({ TIME_LAST_CHECKED: timestamp });

      const result = await resolver.timeLastChecked(createMockObject());

      expect(result).toBe(timestamp);
    });
  });

  describe('isPublic', () => {
    it('should return true when IS_PUBLIC is Y', async () => {
      mockBuildingObjectService.load.mockResolvedValue({ IS_PUBLIC: 'Y' });

      const result = await resolver.isPublic(createMockObject());

      expect(result).toBe(true);
    });

    it('should return false when IS_PUBLIC is not Y', async () => {
      mockBuildingObjectService.load.mockResolvedValue({ IS_PUBLIC: 'N' });

      const result = await resolver.isPublic(createMockObject());

      expect(result).toBe(false);
    });
  });

  describe('cityId', () => {
    it('should return city ID from loaded object', async () => {
      mockBuildingObjectService.load.mockResolvedValue({ CITY_ID: 42 });

      const result = await resolver.cityId(createMockObject());

      expect(result).toBe(42);
    });
  });

  describe('resolvedName', () => {
    it('should return custom structure name from objvars when available', async () => {
      // DynamicVariableType.STRING = 4
      mockObjVarService.getObjVarsForObject.mockResolvedValue([
        { name: 'player_structure.sign.name', type: 4, value: 'My Custom House' },
      ]);

      const result = await resolver.resolvedName(createMockObject(), true);

      expect(result).toBe('My Custom House');
    });

    it('should fall back to name resolution when no custom name', async () => {
      mockObjVarService.getObjVarsForObject.mockResolvedValue([]);
      mockNameResolutionService.resolveName.mockResolvedValue('Generic Building');

      const result = await resolver.resolvedName(createMockObject(), true);

      expect(result).toBe('Generic Building');
    });

    it('should skip custom name when resolveCustomNames is false', async () => {
      mockNameResolutionService.resolveName.mockResolvedValue('Default Name');

      const result = await resolver.resolvedName(createMockObject(), false);

      expect(mockObjVarService.getObjVarsForObject).not.toHaveBeenCalled();
      expect(result).toBe('Default Name');
    });
  });

  describe('adminList', () => {
    it('should fetch admin list from building object service', async () => {
      const mockAdmins = [{ id: '111' }, { id: '222' }];
      mockBuildingObjectService.fetchObjvarAccessList.mockResolvedValue(mockAdmins);

      const result = await resolver.adminList(createMockObject());

      expect(mockBuildingObjectService.fetchObjvarAccessList).toHaveBeenCalledWith(
        '12345',
        'player_structure.admin.adminList'
      );
      expect(result).toEqual(mockAdmins);
    });
  });

  describe('adminListCount', () => {
    it('should return count of admin list', async () => {
      mockBuildingObjectService.fetchObjvarAccessList.mockResolvedValue([{ id: '111' }, { id: '222' }]);

      const result = await resolver.adminListCount(createMockObject());

      expect(result).toBe(2);
    });
  });

  describe('entryList', () => {
    it('should fetch entry list from property lists with character entries', async () => {
      mockPropertyListService.load.mockResolvedValue([{ value: 'c:111' }]);
      mockObjectService.getOne.mockResolvedValue({ id: '111', name: 'Player' });

      const result = await resolver.entryList(createMockObject());

      expect(mockObjectService.getOne).toHaveBeenCalledWith('111');
      expect(result).toHaveLength(1);
    });

    it('should fetch entry list with guild entries', async () => {
      mockPropertyListService.load.mockResolvedValue([{ value: 'G:42' }]);
      mockGuildService.getGuild.mockResolvedValue({ id: '42', name: 'TestGuild' });

      const result = await resolver.entryList(createMockObject());

      expect(mockGuildService.getGuild).toHaveBeenCalledWith('42');
      expect(result).toHaveLength(1);
    });
  });

  describe('entryListCount', () => {
    it('should return count of entry list', async () => {
      mockPropertyListService.load.mockResolvedValue([{ value: 'c:111' }, { value: 'c:222' }]);
      mockObjectService.getOne.mockResolvedValue({ id: '111' });

      const result = await resolver.entryListCount(createMockObject());

      expect(result).toBe(2);
    });
  });

  describe('banList', () => {
    it('should fetch ban list from property lists', async () => {
      mockPropertyListService.load.mockResolvedValue([{ value: 'c:333' }]);
      mockObjectService.getOne.mockResolvedValue({ id: '333', name: 'Banned Player' });

      const result = await resolver.banList(createMockObject());

      expect(result).toHaveLength(1);
    });
  });

  describe('banListCount', () => {
    it('should return count of ban list', async () => {
      mockPropertyListService.load.mockResolvedValue([{ value: 'c:444' }]);
      mockObjectService.getOne.mockResolvedValue({ id: '444' });

      const result = await resolver.banListCount(createMockObject());

      expect(result).toBe(1);
    });
  });
});
