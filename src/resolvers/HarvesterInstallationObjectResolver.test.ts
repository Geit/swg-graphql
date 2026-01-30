import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HarvesterInstallationObjectService } from '../services/HarvesterInstallationObjectService';
import { IServerObject } from '../types';

import { HarvesterInstallationObjectResolver } from './HarvesterInstallationObjectResolver';

describe('HarvesterInstallationObjectResolver', () => {
  let resolver: HarvesterInstallationObjectResolver;
  let mockService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockService = {
      load: vi.fn().mockResolvedValue(null),
    };

    resolver = new HarvesterInstallationObjectResolver(mockService as unknown as HarvesterInstallationObjectService);
  });

  describe('installedEfficiency', () => {
    it('should return installed efficiency from loaded object', async () => {
      mockService.load.mockResolvedValue({ INSTALLED_EFFICIENCY: 0.85 });

      const result = await resolver.installedEfficiency(createMockObject('12345'));

      expect(mockService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(0.85);
    });

    it('should return null when object not found', async () => {
      mockService.load.mockResolvedValue(null);

      const result = await resolver.installedEfficiency(createMockObject('99999'));

      expect(result).toBeNull();
    });
  });

  describe('maxExtractionRate', () => {
    it('should return max extraction rate from loaded object', async () => {
      mockService.load.mockResolvedValue({ MAX_EXTRACTION_RATE: 100 });

      const result = await resolver.maxExtractionRate(createMockObject('12345'));

      expect(result).toBe(100);
    });
  });

  describe('currentExtractionRate', () => {
    it('should return current extraction rate from loaded object', async () => {
      mockService.load.mockResolvedValue({ CURRENT_EXTRACTION_RATE: 75 });

      const result = await resolver.currentExtractionRate(createMockObject('12345'));

      expect(result).toBe(75);
    });
  });

  describe('maxHopperAmount', () => {
    it('should return max hopper amount from loaded object', async () => {
      mockService.load.mockResolvedValue({ MAX_HOPPER_AMOUNT: 10000 });

      const result = await resolver.maxHopperAmount(createMockObject('12345'));

      expect(result).toBe(10000);
    });
  });

  describe('hopperResource', () => {
    it('should return hopper resource from loaded object', async () => {
      mockService.load.mockResolvedValue({ HOPPER_RESOURCE: 54321 });

      const result = await resolver.hopperResource(createMockObject('12345'));

      expect(result).toBe(54321);
    });
  });

  describe('hopperAmount', () => {
    it('should return hopper amount from loaded object', async () => {
      mockService.load.mockResolvedValue({ HOPPER_AMOUNT: 5000 });

      const result = await resolver.hopperAmount(createMockObject('12345'));

      expect(result).toBe(5000);
    });
  });

  describe('resourceType', () => {
    it('should return resource type from loaded object', async () => {
      mockService.load.mockResolvedValue({ RESOURCE_TYPE: 12345 });

      const result = await resolver.resourceType(createMockObject('12345'));

      expect(result).toBe(12345);
    });
  });
});
