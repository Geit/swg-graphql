import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ShipObjectService } from '../services/ShipObjectService';
import { IServerObject } from '../types';

import { ShipObjectResolver } from './ShipObjectResolver';

describe('ShipObjectResolver', () => {
  let resolver: ShipObjectResolver;
  let mockService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockService = {
      load: vi.fn().mockResolvedValue(null),
    };

    resolver = new ShipObjectResolver(mockService as unknown as ShipObjectService);
  });

  describe('slideDampener', () => {
    it('should return slide dampener from loaded object', async () => {
      mockService.load.mockResolvedValue({ SLIDE_DAMPENER: 0.5 });

      const result = await resolver.slideDampener(createMockObject('12345'));

      expect(mockService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(0.5);
    });

    it('should return null when object not found', async () => {
      mockService.load.mockResolvedValue(null);

      const result = await resolver.slideDampener(createMockObject('99999'));

      expect(result).toBeNull();
    });
  });

  describe('currentChassisHitPoints', () => {
    it('should return current chassis hit points from loaded object', async () => {
      mockService.load.mockResolvedValue({ CURRENT_CHASSIS_HIT_POINTS: 1500 });

      const result = await resolver.currentChassisHitPoints(createMockObject('12345'));

      expect(result).toBe(1500);
    });
  });

  describe('maximumChassisHitPoints', () => {
    it('should return maximum chassis hit points from loaded object', async () => {
      mockService.load.mockResolvedValue({ MAXIMUM_CHASSIS_HIT_POINTS: 2000 });

      const result = await resolver.maximumChassisHitPoints(createMockObject('12345'));

      expect(result).toBe(2000);
    });
  });

  describe('chassisType', () => {
    it('should return chassis type from loaded object', async () => {
      mockService.load.mockResolvedValue({ CHASSIS_TYPE: 5 });

      const result = await resolver.chassisType(createMockObject('12345'));

      expect(result).toBe(5);
    });
  });

  describe('engineSpeedMaximum', () => {
    it('should return engine speed maximum from loaded object', async () => {
      mockService.load.mockResolvedValue({ ENGINE_SPEED_MAXIMUM: 100 });

      const result = await resolver.engineSpeedMaximum(createMockObject('12345'));

      expect(result).toBe(100);
    });
  });

  describe('installedDcd', () => {
    it('should return installed DCD as string from loaded object', async () => {
      mockService.load.mockResolvedValue({ INSTALLED_DCD: 12345 });

      const result = await resolver.installedDcd(createMockObject('12345'));

      expect(result).toBe('12345');
    });

    it('should return null when no DCD installed', async () => {
      mockService.load.mockResolvedValue({ INSTALLED_DCD: null });

      const result = await resolver.installedDcd(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('boosterSpeedMaximum', () => {
    it('should return booster speed maximum from loaded object', async () => {
      mockService.load.mockResolvedValue({ BOOSTER_SPEED_MAXIMUM: 200 });

      const result = await resolver.boosterSpeedMaximum(createMockObject('12345'));

      expect(result).toBe(200);
    });
  });

  describe('weaponDamageMaximum', () => {
    it('should return weapon damage maximum from loaded object', async () => {
      mockService.load.mockResolvedValue({ WEAPON_DAMAGE_MAXIMUM: 500 });

      const result = await resolver.weaponDamageMaximum(createMockObject('12345'));

      expect(result).toBe(500);
    });
  });

  describe('shieldHpFrontMaximum', () => {
    it('should return shield HP front maximum from loaded object', async () => {
      mockService.load.mockResolvedValue({ SHIELD_HP_FRONT_MAXIMUM: 1000 });

      const result = await resolver.shieldHpFrontMaximum(createMockObject('12345'));

      expect(result).toBe(1000);
    });
  });
});
