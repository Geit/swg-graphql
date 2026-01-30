import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ClusterClockService } from './ClusterClockService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('ClusterClockService', () => {
  let service: ClusterClockService;

  beforeEach(() => {
    tracker.reset();
    service = new ClusterClockService();
  });

  describe('batchFunction', () => {
    it('should query CLOCK table and return same result for all keys', async () => {
      const mockClockRecord = {
        LAST_SAVE_TIME: 1000000,
        LAST_SAVE_TIMESTAMP: new Date('2024-01-15T12:00:00Z'),
      };
      tracker.on.select('CLOCK').response(mockClockRecord);

      const result = await ClusterClockService.batchFunction(['key1', 'key2', 'key3']);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('CLOCK');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(mockClockRecord);
      expect(result[1]).toEqual(mockClockRecord);
      expect(result[2]).toEqual(mockClockRecord);
    });

    it('should return undefined for all keys when no clock record found', async () => {
      tracker.on.select('CLOCK').response(undefined);

      const result = await ClusterClockService.batchFunction(['key1', 'key2']);

      expect(result[0]).toBeUndefined();
      expect(result[1]).toBeUndefined();
    });
  });

  describe('getRealTime', () => {
    it('should return special date for negative cluster time', async () => {
      const result = await service.getRealTime(-1);

      expect(result).toEqual(new Date(2524608000 * 1000));
    });

    it('should calculate real time from cluster relative time', async () => {
      const lastSaveTimestamp = new Date('2024-01-15T12:00:00Z');
      const mockClockRecord = {
        LAST_SAVE_TIME: 1000,
        LAST_SAVE_TIMESTAMP: lastSaveTimestamp,
      };
      tracker.on.select('CLOCK').response(mockClockRecord);

      // Cluster time is 500 seconds after last save
      const result = await service.getRealTime(1500);

      // Expected: lastSaveTimestamp + 500 seconds
      const expectedDate = new Date(lastSaveTimestamp.getTime() + 500 * 1000);
      expect(result).toEqual(expectedDate);
    });

    it('should return null when no clock record exists', async () => {
      tracker.on.select('CLOCK').response(undefined);

      const result = await service.getRealTime(1000);

      expect(result).toBeNull();
    });

    it('should handle time before last save', async () => {
      const lastSaveTimestamp = new Date('2024-01-15T12:00:00Z');
      const mockClockRecord = {
        LAST_SAVE_TIME: 1000,
        LAST_SAVE_TIMESTAMP: lastSaveTimestamp,
      };
      tracker.on.select('CLOCK').response(mockClockRecord);

      // Cluster time is 200 seconds before last save
      const result = await service.getRealTime(800);

      // Expected: lastSaveTimestamp - 200 seconds
      const expectedDate = new Date(lastSaveTimestamp.getTime() - 200 * 1000);
      expect(result).toEqual(expectedDate);
    });
  });

  describe('load', () => {
    it('should be bound to the dataloader', () => {
      expect(service.load).toBeDefined();
      expect(typeof service.load).toBe('function');
    });
  });
});
