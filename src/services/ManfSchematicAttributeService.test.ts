import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ManfSchematicAttributeService } from './ManfSchematicAttributeService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('ManfSchematicAttributeService', () => {
  let service: ManfSchematicAttributeService;

  beforeEach(() => {
    tracker.reset();
    service = new ManfSchematicAttributeService();
  });

  describe('batchFunction', () => {
    it('should query MANF_SCHEMATIC_ATTRIBUTES with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, ATTRIBUTE_TYPE: 'crafting:damage', VALUE: 100 },
        { OBJECT_ID: 12345, ATTRIBUTE_TYPE: 'crafting:accuracy', VALUE: 50 },
        { OBJECT_ID: 67890, ATTRIBUTE_TYPE: 'crafting:speed', VALUE: 1.5 },
      ];
      tracker.on.select('MANF_SCHEMATIC_ATTRIBUTES').response(mockResults);

      const result = await ManfSchematicAttributeService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('MANF_SCHEMATIC_ATTRIBUTES');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual([mockResults[0], mockResults[1]]);
      expect(result[1]).toEqual([mockResults[2]]);
    });

    it('should return an empty array for keys with no matching rows', async () => {
      tracker.on
        .select('MANF_SCHEMATIC_ATTRIBUTES')
        .response([{ OBJECT_ID: 12345, ATTRIBUTE_TYPE: 'crafting:damage', VALUE: 100 }]);

      const result = await ManfSchematicAttributeService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual([{ OBJECT_ID: 12345, ATTRIBUTE_TYPE: 'crafting:damage', VALUE: 100 }]);
      expect(result[1]).toEqual([]);
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, ATTRIBUTE_TYPE: 'second', VALUE: 2 },
        { OBJECT_ID: 12345, ATTRIBUTE_TYPE: 'first', VALUE: 1 },
      ];
      tracker.on.select('MANF_SCHEMATIC_ATTRIBUTES').response(mockResults);

      const result = await ManfSchematicAttributeService.batchFunction(['12345', '67890']);

      expect(result[0]?.[0].OBJECT_ID).toBe(12345);
      expect(result[1]?.[0].OBJECT_ID).toBe(67890);
    });
  });

  describe('load', () => {
    it('should be bound to the dataloader', () => {
      expect(service.load).toBeDefined();
      expect(typeof service.load).toBe('function');
    });
  });
});
