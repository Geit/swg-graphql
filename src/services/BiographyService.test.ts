import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BiographyService } from './BiographyService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('BiographyService', () => {
  let service: BiographyService;

  beforeEach(() => {
    tracker.reset();
    service = new BiographyService();
  });

  describe('batchFunction', () => {
    it('should query BIOGRAPHIES with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, BIOGRAPHY: 'A long time ago...' },
        { OBJECT_ID: 67890, BIOGRAPHY: 'In a galaxy far, far away...' },
      ];
      tracker.on.select('BIOGRAPHIES').response(mockResults);

      const result = await BiographyService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('BIOGRAPHIES');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, BIOGRAPHY: 'Has a bio' }];
      tracker.on.select('BIOGRAPHIES').response(mockResults);

      const result = await BiographyService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, BIOGRAPHY: 'Second' },
        { OBJECT_ID: 12345, BIOGRAPHY: 'First' },
      ];
      tracker.on.select('BIOGRAPHIES').response(mockResults);

      const result = await BiographyService.batchFunction(['12345', '67890']);

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
