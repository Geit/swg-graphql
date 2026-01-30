import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ServerObjectService } from './ServerObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

// Mock tagify
vi.mock('../utils/tagify', () => ({
  default: vi.fn((tag: string) => {
    const tagMap: Record<string, number> = { CREO: 1129465679 };
    return tagMap[tag] || 0;
  }),
}));

describe('ServerObjectService', () => {
  let service: ServerObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new ServerObjectService();
  });

  describe('getMany', () => {
    it('should query OBJECTS table with default limit', async () => {
      tracker.on.select('OBJECTS').response([]);

      const result = await service.getMany({});

      expect(result).toEqual([]);
    });

    it('should apply custom limit', async () => {
      tracker.on.select('OBJECTS').response([]);

      await service.getMany({ limit: 10 });

      const query = tracker.history.select[0];
      expect(query.sql).toContain('limit');
      expect(query.bindings).toContain(10);
    });

    it('should filter by containedById', async () => {
      tracker.on.select('OBJECTS').response([]);

      await service.getMany({ containedById: '12345' });

      const query = tracker.history.select[0];
      expect(query.sql).toContain('CONTAINED_BY');
      expect(query.bindings).toContain('12345');
    });

    it('should filter by excludeDeleted', async () => {
      tracker.on.select('OBJECTS').response([]);

      await service.getMany({ excludeDeleted: true });

      const query = tracker.history.select[0];
      expect(query.sql).toContain('DELETED');
    });

    it('should filter by objectTypes', async () => {
      tracker.on.select('OBJECTS').response([]);

      await service.getMany({ objectTypes: [1, 2, 3] });

      const query = tracker.history.select[0];
      expect(query.sql).toContain('TYPE_ID');
      expect(query.bindings).toEqual(expect.arrayContaining([1, 2, 3]));
    });

    it('should convert records to ServerObject format', async () => {
      const mockResults = [
        {
          OBJECT_ID: 12345,
          X: 100.5,
          Y: 200.5,
          Z: 300.5,
          QUATERNION_W: 1,
          QUATERNION_X: 0,
          QUATERNION_Y: 0,
          QUATERNION_Z: 0,
          NODE_X: 10,
          NODE_Y: 20,
          NODE_Z: 30,
          TYPE_ID: 1129465679,
          SCENE_ID: 'tatooine',
          CONTROLLER_TYPE: 1,
          DELETED: null,
          OBJECT_NAME: 'Test Object',
          VOLUME: 1,
          CONTAINED_BY: '111',
          SLOT_ARRANGEMENT: 0,
          PLAYER_CONTROLLED: 'N',
          CACHE_VERSION: 1,
          LOAD_CONTENTS: 'Y',
          CASH_BALANCE: 100,
          BANK_BALANCE: 1000,
          COMPLEXITY: 1,
          NAME_STRING_TABLE: 'obj_n',
          NAME_STRING_TEXT: 'object',
          OBJECT_TEMPLATE_ID: 12345,
          STATIC_ITEM_NAME: null,
          STATIC_ITEM_VERSION: null,
          CONVERSION_ID: null,
          DELETED_DATE: null,
          LOAD_WITH: '222',
          SCRIPT_LIST: 'script1:script2:',
          OBJECT_SCALE: 1.0,
        },
      ];
      tracker.on.select('OBJECTS').response(mockResults);

      const result = await service.getMany({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('12345');
      expect(result[0].location).toEqual([100.5, 200.5, 300.5]);
      expect(result[0].scene).toBe('tatooine');
      expect(result[0].scriptList).toEqual(['script1', 'script2']);
    });
  });

  describe('countMany', () => {
    it('should return count of matching objects', async () => {
      tracker.on.select('OBJECTS').response([{ count: 100 }]);

      const result = await service.countMany({});

      expect(result).toBe(100);
    });
  });

  describe('batchFunction', () => {
    it('should query OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, TYPE_ID: 1, SCENE_ID: 'tatooine', SCRIPT_LIST: null },
        { OBJECT_ID: 67890, TYPE_ID: 2, SCENE_ID: 'naboo', SCRIPT_LIST: null },
      ];
      tracker.on.select('OBJECTS').response(mockResults);

      const result = await ServerObjectService.batchFunction(['12345', '67890']);

      expect(result).toHaveLength(2);
    });

    it('should return null for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, TYPE_ID: 1, SCENE_ID: 'tatooine', SCRIPT_LIST: null }];
      tracker.on.select('OBJECTS').response(mockResults);

      const result = await ServerObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).not.toBeNull();
      expect(result[1]).toBeNull();
    });
  });

  describe('getOne', () => {
    it('should be bound to the dataloader', () => {
      expect(service.getOne).toBeDefined();
      expect(typeof service.getOne).toBe('function');
    });
  });
});
