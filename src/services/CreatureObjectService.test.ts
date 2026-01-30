import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CreatureObjectService } from './CreatureObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('CreatureObjectService', () => {
  let service: CreatureObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new CreatureObjectService();
  });

  describe('batchFunction', () => {
    it('should query CREATURE_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, SCALE_FACTOR: 1.0, POSTURE: 0, RANK: 1 },
        { OBJECT_ID: 67890, SCALE_FACTOR: 1.5, POSTURE: 1, RANK: 2 },
      ];
      tracker.on.select('CREATURE_OBJECTS').response(mockResults);

      const result = await CreatureObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('CREATURE_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, SCALE_FACTOR: 1.0 }];
      tracker.on.select('CREATURE_OBJECTS').response(mockResults);

      const result = await CreatureObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, SCALE_FACTOR: 1.5 },
        { OBJECT_ID: 12345, SCALE_FACTOR: 1.0 },
      ];
      tracker.on.select('CREATURE_OBJECTS').response(mockResults);

      const result = await CreatureObjectService.batchFunction(['12345', '67890']);

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
