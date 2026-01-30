import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WeaponObjectService } from './WeaponObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('WeaponObjectService', () => {
  let service: WeaponObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new WeaponObjectService();
  });

  describe('batchFunction', () => {
    it('should query WEAPON_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, MIN_DAMAGE: 50, MAX_DAMAGE: 100, ATTACK_SPEED: 1.5 },
        { OBJECT_ID: 67890, MIN_DAMAGE: 75, MAX_DAMAGE: 150, ATTACK_SPEED: 2.0 },
      ];
      tracker.on.select('WEAPON_OBJECTS').response(mockResults);

      const result = await WeaponObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('WEAPON_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, MIN_DAMAGE: 50, MAX_DAMAGE: 100 }];
      tracker.on.select('WEAPON_OBJECTS').response(mockResults);

      const result = await WeaponObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, MIN_DAMAGE: 75 },
        { OBJECT_ID: 12345, MIN_DAMAGE: 50 },
      ];
      tracker.on.select('WEAPON_OBJECTS').response(mockResults);

      const result = await WeaponObjectService.batchFunction(['12345', '67890']);

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
