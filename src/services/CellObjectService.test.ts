import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CellObjectService } from './CellObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('CellObjectService', () => {
  let service: CellObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new CellObjectService();
  });

  describe('batchFunction', () => {
    it('should query CELL_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, CELL_NUMBER: 1, IS_PUBLIC: 'Y' },
        { OBJECT_ID: 67890, CELL_NUMBER: 2, IS_PUBLIC: 'N' },
      ];
      tracker.on.select('CELL_OBJECTS').response(mockResults);

      const result = await CellObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('CELL_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, CELL_NUMBER: 1 }];
      tracker.on.select('CELL_OBJECTS').response(mockResults);

      const result = await CellObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, CELL_NUMBER: 2 },
        { OBJECT_ID: 12345, CELL_NUMBER: 1 },
      ];
      tracker.on.select('CELL_OBJECTS').response(mockResults);

      const result = await CellObjectService.batchFunction(['12345', '67890']);

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
