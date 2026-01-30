import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BuildingObjectService } from './BuildingObjectService';
import { ObjVarService } from './ObjVarService';
import { ServerObjectService } from './ServerObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

// Mock the ObjVarService
vi.mock('./ObjVarService', () => ({
  ObjVarService: vi.fn().mockImplementation(() => ({
    getObjVarsForObject: vi.fn().mockResolvedValue([]),
  })),
  stringArrayObjvar: vi.fn((name: string) => (obj: { name: string }) => obj.name === name),
}));

// Mock the ServerObjectService
vi.mock('./ServerObjectService', () => ({
  ServerObjectService: vi.fn().mockImplementation(() => ({
    getMany: vi.fn().mockResolvedValue([]),
  })),
}));

describe('BuildingObjectService', () => {
  let service: BuildingObjectService;
  let mockObjVarService: { getObjVarsForObject: ReturnType<typeof vi.fn> };
  let mockObjectService: { getMany: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tracker.reset();

    mockObjVarService = {
      getObjVarsForObject: vi.fn().mockResolvedValue([]),
    };

    mockObjectService = {
      getMany: vi.fn().mockResolvedValue([]),
    };

    service = new BuildingObjectService(
      mockObjVarService as unknown as ObjVarService,
      mockObjectService as unknown as ServerObjectService
    );
  });

  describe('batchFunction', () => {
    it('should query BUILDING_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, MAINTENANCE_COST: 100, IS_PUBLIC: 'Y' },
        { OBJECT_ID: 67890, MAINTENANCE_COST: 200, IS_PUBLIC: 'N' },
      ];
      tracker.on.select('BUILDING_OBJECTS').response(mockResults);

      const result = await BuildingObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('BUILDING_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, MAINTENANCE_COST: 100, IS_PUBLIC: 'Y' }];
      tracker.on.select('BUILDING_OBJECTS').response(mockResults);

      const result = await BuildingObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, MAINTENANCE_COST: 200 },
        { OBJECT_ID: 12345, MAINTENANCE_COST: 100 },
      ];
      tracker.on.select('BUILDING_OBJECTS').response(mockResults);

      const result = await BuildingObjectService.batchFunction(['12345', '67890']);

      expect(result[0]?.OBJECT_ID).toBe(12345);
      expect(result[1]?.OBJECT_ID).toBe(67890);
    });
  });

  describe('load', () => {
    it('should be bound to the dataloader', () => {
      expect(service.load).toBeDefined();
      expect(typeof service.load).toBe('function');
    });
  });

  describe('fetchObjvarAccessList', () => {
    it('should fetch objvars and return matching objects', async () => {
      const mockObjVars = [
        { name: 'VAR_ADMIN_LIST', type: 6, value: ['111', '222'] },
        { name: 'other_var', type: 0, value: 'test' },
      ];
      mockObjVarService.getObjVarsForObject.mockResolvedValue(mockObjVars);

      const mockObjects = [{ id: '111' }, { id: '222' }];
      mockObjectService.getMany.mockResolvedValue(mockObjects);

      const result = await service.fetchObjvarAccessList('12345', 'VAR_ADMIN_LIST');

      expect(mockObjVarService.getObjVarsForObject).toHaveBeenCalledWith('12345');
      expect(mockObjectService.getMany).toHaveBeenCalledWith({ objectIds: ['111', '222'] });
      expect(result).toEqual(mockObjects);
    });

    it('should return empty array when objvar not found', async () => {
      mockObjVarService.getObjVarsForObject.mockResolvedValue([{ name: 'other_var', type: 0, value: 'test' }]);
      mockObjectService.getMany.mockResolvedValue([]);

      const result = await service.fetchObjvarAccessList('12345', 'VAR_ADMIN_LIST');

      expect(mockObjectService.getMany).toHaveBeenCalledWith({ objectIds: [] });
      expect(result).toEqual([]);
    });
  });
});
