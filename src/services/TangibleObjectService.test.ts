import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TangibleObjectService } from './TangibleObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('TangibleObjectService', () => {
  let service: TangibleObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new TangibleObjectService();
  });

  describe('batchFunction', () => {
    it('should query TANGIBLE_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, MAX_HIT_POINTS: 1000, OWNER_ID: '111', DAMAGE_TAKEN: 50 },
        { OBJECT_ID: 67890, MAX_HIT_POINTS: 2000, OWNER_ID: '222', DAMAGE_TAKEN: 100 },
      ];
      tracker.on.select('TANGIBLE_OBJECTS').response(mockResults);

      const result = await TangibleObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('TANGIBLE_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, MAX_HIT_POINTS: 1000 }];
      tracker.on.select('TANGIBLE_OBJECTS').response(mockResults);

      const result = await TangibleObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, MAX_HIT_POINTS: 2000 },
        { OBJECT_ID: 12345, MAX_HIT_POINTS: 1000 },
      ];
      tracker.on.select('TANGIBLE_OBJECTS').response(mockResults);

      const result = await TangibleObjectService.batchFunction(['12345', '67890']);

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
