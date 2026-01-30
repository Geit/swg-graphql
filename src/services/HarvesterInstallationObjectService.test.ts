import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HarvesterInstallationObjectService } from './HarvesterInstallationObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('HarvesterInstallationObjectService', () => {
  let service: HarvesterInstallationObjectService;

  beforeEach(() => {
    tracker.reset();
    service = new HarvesterInstallationObjectService();
  });

  describe('batchFunction', () => {
    it('should query HARVESTER_INSTALLATION_OBJECTS with provided keys', async () => {
      const mockResults = [
        { OBJECT_ID: 12345, INSTALLED_EFFICIENCY: 0.85, MAX_EXTRACTION_RATE: 100, HOPPER_AMOUNT: 500 },
        { OBJECT_ID: 67890, INSTALLED_EFFICIENCY: 0.9, MAX_EXTRACTION_RATE: 150, HOPPER_AMOUNT: 750 },
      ];
      tracker.on.select('HARVESTER_INSTALLATION_OBJECTS').response(mockResults);

      const result = await HarvesterInstallationObjectService.batchFunction(['12345', '67890']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('HARVESTER_INSTALLATION_OBJECTS');
      expect(query.bindings).toEqual(['12345', '67890']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toEqual(mockResults[1]);
    });

    it('should return undefined for keys not found in results', async () => {
      const mockResults = [{ OBJECT_ID: 12345, INSTALLED_EFFICIENCY: 0.85 }];
      tracker.on.select('HARVESTER_INSTALLATION_OBJECTS').response(mockResults);

      const result = await HarvesterInstallationObjectService.batchFunction(['12345', '99999']);

      expect(result[0]).toEqual(mockResults[0]);
      expect(result[1]).toBeUndefined();
    });

    it('should return results in the same order as keys', async () => {
      const mockResults = [
        { OBJECT_ID: 67890, INSTALLED_EFFICIENCY: 0.9 },
        { OBJECT_ID: 12345, INSTALLED_EFFICIENCY: 0.85 },
      ];
      tracker.on.select('HARVESTER_INSTALLATION_OBJECTS').response(mockResults);

      const result = await HarvesterInstallationObjectService.batchFunction(['12345', '67890']);

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
