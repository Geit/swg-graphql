import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ManfSchematicObjectService } from './ManfSchematicObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('ManfSchematicObjectService', () => {
  let service: ManfSchematicObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new ManfSchematicObjectService();
  });

  describe('batchFunction', () => {
    it('should query MANF_SCHEMATIC with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, CREATOR_ID: '111', CREATOR_NAME: 'Crafter1', ITEMS_PER_CONTAINER: 25 },
        { OBJECT_ID: 67890, CREATOR_ID: '222', CREATOR_NAME: 'Crafter2', ITEMS_PER_CONTAINER: 50 },
      ];
      tracker.on.select('MANF_SCHEMATIC').response(mockResults);

      const result = await ManfSchematicObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('MANF_SCHEMATIC');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, CREATOR_NAME: 'Crafter1' }];
      tracker.on.select('MANF_SCHEMATIC').response(mockResults);

      const result = await ManfSchematicObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, CREATOR_NAME: 'Crafter2' },
        { OBJECT_ID: 12345, CREATOR_NAME: 'Crafter1' },
      ];
      tracker.on.select('MANF_SCHEMATIC').response(mockResults);

      const result = await ManfSchematicObjectService.batchFunction(['12345', '67890']);

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
