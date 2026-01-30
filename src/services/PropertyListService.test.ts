import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PropertyListService } from './PropertyListService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('PropertyListService', () => {
  let service: PropertyListService;

  beforeEach(() => {
    tracker.reset();
    service = new PropertyListService();
  });

  describe('batchFunction', () => {
    it('should query PROPERTY_LISTS and return results grouped by key', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, LIST_ID: 1, VALUE: 'value1' },
        { OBJECT_ID: 12345, LIST_ID: 2, VALUE: 'value2' },
        { OBJECT_ID: 67890, LIST_ID: 1, VALUE: 'value3' },
      ];
      tracker.on.select('PROPERTY_LISTS').response(mockResults);

      const result = await PropertyListService.batchFunction([{ objectId: '12345' }, { objectId: '67890' }]);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('PROPERTY_LISTS');
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(2); // Object 12345 has 2 entries
      expect(result[1]).toHaveLength(1); // Object 67890 has 1 entry
    });

    it('should filter by listId when provided', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, LIST_ID: 1, VALUE: 'value1' },
        { OBJECT_ID: 12345, LIST_ID: 2, VALUE: 'value2' },
      ];
      tracker.on.select('PROPERTY_LISTS').response(mockResults);

      const result = await PropertyListService.batchFunction([{ objectId: '12345', listId: 1 }]);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1); // Only LIST_ID 1 should be returned
      expect(result[0][0].listId).toBe(1);
    });

    it('should return empty arrays for objects with no property lists', async () => {
      tracker.on.select('PROPERTY_LISTS').response([]);

      const result = await PropertyListService.batchFunction([{ objectId: '99999' }]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual([]);
    });

    it('should convert records to PropertyListEntry format', async () => {
      const mockResults = [{ OBJECT_ID: 12345, LIST_ID: 5, VALUE: 'test_value' }];
      tracker.on.select('PROPERTY_LISTS').response(mockResults);

      const result = await PropertyListService.batchFunction([{ objectId: '12345' }]);

      expect(result[0][0]).toEqual({
        listId: 5,
        value: 'test_value',
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
