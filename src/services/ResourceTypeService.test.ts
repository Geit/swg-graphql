import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ResourceTypeService } from './ResourceTypeService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('ResourceTypeService', () => {
  let service: ResourceTypeService;

  beforeEach(() => {
    tracker.reset();
    service = new ResourceTypeService();
  });

  describe('getMany', () => {
    it('should query RESOURCE_TYPES with default limit of 50', async () => {
      tracker.on.select('RESOURCE_TYPES').response([]);

      await service.getMany({});

      const query = tracker.history.select[0];
      expect(query.sql).toContain('RESOURCE_TYPES');
      expect(query.sql).toContain('limit');
      expect(query.bindings).toContain(50); // default limit
      // Note: Knex omits OFFSET 0 from SQL as an optimization
    });

    it('should apply custom limit and offset', async () => {
      tracker.on.select('RESOURCE_TYPES').response([]);

      await service.getMany({ limit: 10, offset: 20 });

      const query = tracker.history.select[0];
      expect(query.sql).toContain('limit');
      expect(query.bindings).toContain(10);
      expect(query.bindings).toContain(20);
    });

    it('should convert records to ResourceType format', async () => {
      const mockResults = [
        {
          RESOURCE_ID: 12345,
          RESOURCE_NAME: 'TestResource',
          RESOURCE_CLASS: 'metal_ferrous',
          DEPLETED_TIMESTAMP: 1000000,
          ATTRIBUTES: 'res_decay_resist 697:res_flavor 932:',
          FRACTAL_SEEDS: '10000016 1138858556:',
        },
      ];
      tracker.on.select('RESOURCE_TYPES').response(mockResults);

      const result = await service.getMany({});

      expect(result[0]).toEqual({
        id: '12345',
        name: 'TestResource',
        classId: 'metal_ferrous',
        depletedTime: 1000000,
        attributes: [
          { attributeId: 'res_decay_resist', value: 697 },
          { attributeId: 'res_flavor', value: 932 },
        ],
        planetDistribution: [{ planetId: '10000016', seed: 1138858556 }],
      });
    });

    it('should handle null attributes and fractal seeds', async () => {
      const mockResults = [
        {
          RESOURCE_ID: 1,
          RESOURCE_NAME: 'Test',
          RESOURCE_CLASS: 'metal',
          DEPLETED_TIMESTAMP: null,
          ATTRIBUTES: null,
          FRACTAL_SEEDS: null,
        },
      ];
      tracker.on.select('RESOURCE_TYPES').response(mockResults);

      const result = await service.getMany({});

      expect(result[0].attributes).toBeNull();
      expect(result[0].planetDistribution).toBeNull();
    });
  });

  describe('countMany', () => {
    it('should return count of resource types', async () => {
      tracker.on.select('RESOURCE_TYPES').response([{ count: 100 }]);

      const result = await service.countMany({});

      expect(result).toBe(100);
    });
  });

  describe('batchFunction', () => {
    it('should query RESOURCE_TYPES with provided keys', async () => {
      const mockResults = [
        { RESOURCE_ID: 12345, RESOURCE_NAME: 'Iron', RESOURCE_CLASS: 'metal', ATTRIBUTES: null, FRACTAL_SEEDS: null },
        { RESOURCE_ID: 67890, RESOURCE_NAME: 'Copper', RESOURCE_CLASS: 'metal', ATTRIBUTES: null, FRACTAL_SEEDS: null },
      ];
      tracker.on.select('RESOURCE_TYPES').response(mockResults);

      const result = await ResourceTypeService.batchFunction(['12345', '67890']);

      expect(result).toHaveLength(2);
    });

    it('should return null for keys not found in results', async () => {
      const mockResults = [
        { RESOURCE_ID: 12345, RESOURCE_NAME: 'Iron', RESOURCE_CLASS: 'metal', ATTRIBUTES: null, FRACTAL_SEEDS: null },
      ];
      tracker.on.select('RESOURCE_TYPES').response(mockResults);

      const result = await ResourceTypeService.batchFunction(['12345', '99999']);

      expect(result[0]).not.toBeNull();
      expect(result[1]).toBeNull();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { RESOURCE_ID: 67890, RESOURCE_NAME: 'Copper', RESOURCE_CLASS: 'metal', ATTRIBUTES: null, FRACTAL_SEEDS: null },
        { RESOURCE_ID: 12345, RESOURCE_NAME: 'Iron', RESOURCE_CLASS: 'metal', ATTRIBUTES: null, FRACTAL_SEEDS: null },
      ];
      tracker.on.select('RESOURCE_TYPES').response(mockResults);

      const result = await ResourceTypeService.batchFunction(['12345', '67890']);

      expect(result[0]?.id).toBe('12345');
      expect(result[1]?.id).toBe('67890');
    });
  });

  describe('getOne', () => {
    it('should be bound to the dataloader', () => {
      expect(service.getOne).toBeDefined();
      expect(typeof service.getOne).toBe('function');
    });
  });
});
