import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ShipObjectService } from './ShipObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('ShipObjectService', () => {
  let service: ShipObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new ShipObjectService();
  });

  describe('batchFunction', () => {
    it('should query SHIP_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, CHASSIS_TYPE: 1, ENGINE_SPEED_MAXIMUM: 100 },
        { OBJECT_ID: 67890, CHASSIS_TYPE: 2, ENGINE_SPEED_MAXIMUM: 150 },
      ];
      tracker.on.select('SHIP_OBJECTS').response(mockResults);

      const result = await ShipObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('SHIP_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, CHASSIS_TYPE: 1 }];
      tracker.on.select('SHIP_OBJECTS').response(mockResults);

      const result = await ShipObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, CHASSIS_TYPE: 2 },
        { OBJECT_ID: 12345, CHASSIS_TYPE: 1 },
      ];
      tracker.on.select('SHIP_OBJECTS').response(mockResults);

      const result = await ShipObjectService.batchFunction(['12345', '67890']);

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
});
