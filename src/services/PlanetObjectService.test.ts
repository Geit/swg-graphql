import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PlanetObjectService } from './PlanetObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('PlanetObjectService', () => {
  let service: PlanetObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new PlanetObjectService();
  });

  describe('batchFunction', () => {
    it('should query PLANET_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, PLANET_NAME: 'tatooine' },
        { OBJECT_ID: 67890, PLANET_NAME: 'naboo' },
      ];
      tracker.on.select('PLANET_OBJECTS').response(mockResults);

      const result = await PlanetObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('PLANET_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, PLANET_NAME: 'tatooine' }];
      tracker.on.select('PLANET_OBJECTS').response(mockResults);

      const result = await PlanetObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, PLANET_NAME: 'naboo' },
        { OBJECT_ID: 12345, PLANET_NAME: 'tatooine' },
      ];
      tracker.on.select('PLANET_OBJECTS').response(mockResults);

      const result = await PlanetObjectService.batchFunction(['12345', '67890']);

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
