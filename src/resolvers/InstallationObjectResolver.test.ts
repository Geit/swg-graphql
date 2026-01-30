import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BuildingObjectService } from '../services/BuildingObjectService';
import { InstallationObjectService } from '../services/InstallationObjectService';
import { IServerObject } from '../types';

import { InstallationObjectResolver } from './InstallationObjectResolver';

describe('InstallationObjectResolver', () => {
  let resolver: InstallationObjectResolver;
  let mockInstallationService: { load: ReturnType<typeof vi.fn> };
  let mockBuildingService: { fetchObjvarAccessList: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockInstallationService = {
      load: vi.fn().mockResolvedValue(null),
    };

    mockBuildingService = {
      fetchObjvarAccessList: vi.fn().mockResolvedValue([]),
    };

    resolver = new InstallationObjectResolver(
      mockInstallationService as unknown as InstallationObjectService,
      mockBuildingService as unknown as BuildingObjectService
    );
  });

  describe('installationType', () => {
    it('should return installation type from loaded object', async () => {
      mockInstallationService.load.mockResolvedValue({ INSTALLATION_TYPE: 3 });

      const result = await resolver.installationType(createMockObject('12345'));

      expect(mockInstallationService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(3);
    });

    it('should return null when object not found', async () => {
      mockInstallationService.load.mockResolvedValue(null);

      const result = await resolver.installationType(createMockObject('99999'));

      expect(result).toBeNull();
    });
  });

  describe('activated', () => {
    it('should return true when ACTIVATED is Y', async () => {
      mockInstallationService.load.mockResolvedValue({ ACTIVATED: 'Y' });

      const result = await resolver.activated(createMockObject('12345'));

      expect(result).toBe(true);
    });

    it('should return false when ACTIVATED is N', async () => {
      mockInstallationService.load.mockResolvedValue({ ACTIVATED: 'N' });

      const result = await resolver.activated(createMockObject('12345'));

      expect(result).toBe(false);
    });

    it('should return false when object not found', async () => {
      mockInstallationService.load.mockResolvedValue(null);

      const result = await resolver.activated(createMockObject('99999'));

      expect(result).toBe(false);
    });
  });

  describe('tickCount', () => {
    it('should return tick count from loaded object', async () => {
      mockInstallationService.load.mockResolvedValue({ TICK_COUNT: 100 });

      const result = await resolver.tickCount(createMockObject('12345'));

      expect(result).toBe(100);
    });
  });

  describe('power', () => {
    it('should return power from loaded object', async () => {
      mockInstallationService.load.mockResolvedValue({ POWER: 500 });

      const result = await resolver.power(createMockObject('12345'));

      expect(result).toBe(500);
    });
  });

  describe('powerRate', () => {
    it('should return power rate from loaded object', async () => {
      mockInstallationService.load.mockResolvedValue({ POWER_RATE: 10 });

      const result = await resolver.powerRate(createMockObject('12345'));

      expect(result).toBe(10);
    });
  });

  describe('hopperList', () => {
    it('should call fetchObjvarAccessList with correct parameters', async () => {
      const mockObjects = [{ id: '111' }, { id: '222' }];
      mockBuildingService.fetchObjvarAccessList.mockResolvedValue(mockObjects);

      const result = await resolver.hopperList(createMockObject('12345'));

      expect(mockBuildingService.fetchObjvarAccessList).toHaveBeenCalledWith(
        '12345',
        'player_structure.hopper.hopperList'
      );
      expect(result).toEqual(mockObjects);
    });
  });

  describe('hopperListCount', () => {
    it('should return count of hopper list entries', async () => {
      mockBuildingService.fetchObjvarAccessList.mockResolvedValue([{ id: '111' }, { id: '222' }, { id: '333' }]);

      const result = await resolver.hopperListCount(createMockObject('12345'));

      expect(result).toBe(3);
    });

    it('should return 0 when hopper list is empty', async () => {
      mockBuildingService.fetchObjvarAccessList.mockResolvedValue([]);

      const result = await resolver.hopperListCount(createMockObject('12345'));

      expect(result).toBe(0);
    });
  });
});
