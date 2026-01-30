import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PlayerObjectService } from './PlayerObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('PlayerObjectService', () => {
  let service: PlayerObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new PlayerObjectService();
  });

  describe('batchFunction', () => {
    it('should query PLAYER_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, STATION_ID: 1001, SKILL_TEMPLATE: 'combat_brawler', NUM_LOTS: 10 },
        { OBJECT_ID: 67890, STATION_ID: 1002, SKILL_TEMPLATE: 'science_medic', NUM_LOTS: 8 },
      ];
      tracker.on.select('PLAYER_OBJECTS').response(mockResults);

      const result = await PlayerObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('PLAYER_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, STATION_ID: 1001 }];
      tracker.on.select('PLAYER_OBJECTS').response(mockResults);

      const result = await PlayerObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, STATION_ID: 1002 },
        { OBJECT_ID: 12345, STATION_ID: 1001 },
      ];
      tracker.on.select('PLAYER_OBJECTS').response(mockResults);

      const result = await PlayerObjectService.batchFunction(['12345', '67890']);

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
