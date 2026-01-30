import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ResourceContainerObjectService } from './ResourceContainerObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('ResourceContainerObjectService', () => {
  let service: ResourceContainerObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new ResourceContainerObjectService();
  });

  describe('batchFunction', () => {
    it('should query RESOURCE_CONTAINER_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, RESOURCE_TYPE: 100, QUANTITY: 500 },
        { OBJECT_ID: 67890, RESOURCE_TYPE: 200, QUANTITY: 1000 },
      ];
      tracker.on.select('RESOURCE_CONTAINER_OBJECTS').response(mockResults);

      const result = await ResourceContainerObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('RESOURCE_CONTAINER_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, RESOURCE_TYPE: 100 }];
      tracker.on.select('RESOURCE_CONTAINER_OBJECTS').response(mockResults);

      const result = await ResourceContainerObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, RESOURCE_TYPE: 200 },
        { OBJECT_ID: 12345, RESOURCE_TYPE: 100 },
      ];
      tracker.on.select('RESOURCE_CONTAINER_OBJECTS').response(mockResults);

      const result = await ResourceContainerObjectService.batchFunction(['12345', '67890']);

      expect(result[0]?.OBJECT_ID).toBe(12345);
      expect(result[1]?.OBJECT_ID).toBe(67890);
    });
  });

  describe('getCirculationAmountForResourceTypeId', () => {
    it('should return total quantity and container count for a resource type', async () => {
      tracker.on.select('RESOURCE_CONTAINER_OBJECTS').response({
        'SUM("QUANTITY")': 5000,
        'COUNT(*)': 10,
      });

      const result = await service.getCirculationAmountForResourceTypeId(12345);

      expect(result).toEqual({
        totalQuantity: 5000,
        containerObjects: 10,
      });
    });

    it('should return 0 for totalQuantity when no resources found', async () => {
      tracker.on.select('RESOURCE_CONTAINER_OBJECTS').response({
        'SUM("QUANTITY")': null,
        'COUNT(*)': 0,
      });

      const result = await service.getCirculationAmountForResourceTypeId(99999);

      expect(result).toEqual({
        totalQuantity: 0,
        containerObjects: 0,
      });
    });
  });

  describe('load', () => {
    it('should be bound to the dataloader', () => {
      expect(service.load).toBeDefined();
      expect(typeof service.load).toBe('function');
    });
  });
});
