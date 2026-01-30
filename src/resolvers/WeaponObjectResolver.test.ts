import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WeaponObjectService } from '../services/WeaponObjectService';
import { IServerObject } from '../types';

import { WeaponObjectResolver } from './WeaponObjectResolver';

describe('WeaponObjectResolver', () => {
  let resolver: WeaponObjectResolver;
  let mockWeaponObjectService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockWeaponObjectService = {
      load: vi.fn().mockResolvedValue(null),
    };

    resolver = new WeaponObjectResolver(mockWeaponObjectService as unknown as WeaponObjectService);
  });

  describe('minDamage', () => {
    it('should return min damage from loaded object', async () => {
      mockWeaponObjectService.load.mockResolvedValue({ MIN_DAMAGE: 50 });

      const result = await resolver.minDamage(createMockObject('12345'));

      expect(mockWeaponObjectService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(50);
    });

    it('should return null when object not found', async () => {
      mockWeaponObjectService.load.mockResolvedValue(null);

      const result = await resolver.minDamage(createMockObject('99999'));

      expect(result).toBeNull();
    });
  });

  describe('maxDamage', () => {
    it('should return max damage from loaded object', async () => {
      mockWeaponObjectService.load.mockResolvedValue({ MAX_DAMAGE: 100 });

      const result = await resolver.maxDamage(createMockObject('12345'));

      expect(result).toBe(100);
    });
  });

  describe('damageType', () => {
    it('should return damage type from loaded object', async () => {
      mockWeaponObjectService.load.mockResolvedValue({ DAMAGE_TYPE: 1 });

      const result = await resolver.damageType(createMockObject('12345'));

      expect(result).toBe(1);
    });
  });

  describe('elementalType', () => {
    it('should return elemental type from loaded object', async () => {
      mockWeaponObjectService.load.mockResolvedValue({ ELEMENTAL_TYPE: 2 });

      const result = await resolver.elementalType(createMockObject('12345'));

      expect(result).toBe(2);
    });
  });

  describe('elementalValue', () => {
    it('should return elemental value from loaded object', async () => {
      mockWeaponObjectService.load.mockResolvedValue({ ELEMENTAL_VALUE: 25 });

      const result = await resolver.elementalValue(createMockObject('12345'));

      expect(result).toBe(25);
    });
  });

  describe('attackSpeed', () => {
    it('should return attack speed from loaded object', async () => {
      mockWeaponObjectService.load.mockResolvedValue({ ATTACK_SPEED: 1.5 });

      const result = await resolver.attackSpeed(createMockObject('12345'));

      expect(result).toBe(1.5);
    });
  });

  describe('dps', () => {
    it('should calculate DPS correctly', async () => {
      mockWeaponObjectService.load.mockResolvedValue({
        MIN_DAMAGE: 100,
        MAX_DAMAGE: 200,
        ELEMENTAL_VALUE: 50,
        ATTACK_SPEED: 2,
      });

      const result = await resolver.dps(createMockObject('12345'));

      // DPS = ((min + max) / 2 + 2 * ele) / atkSpd
      // DPS = ((100 + 200) / 2 + 2 * 50) / 2 = (150 + 100) / 2 = 125
      expect(result).toBe(125);
    });

    it('should return 0 when weapon not found', async () => {
      mockWeaponObjectService.load.mockResolvedValue(null);

      const result = await resolver.dps(createMockObject('99999'));

      expect(result).toBe(0);
    });

    it('should return 0 when missing required fields', async () => {
      mockWeaponObjectService.load.mockResolvedValue({
        MIN_DAMAGE: 100,
        MAX_DAMAGE: null,
        ELEMENTAL_VALUE: 50,
        ATTACK_SPEED: 2,
      });

      const result = await resolver.dps(createMockObject('12345'));

      expect(result).toBe(0);
    });
  });
});
