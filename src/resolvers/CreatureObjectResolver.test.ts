import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CreatureObjectService } from '../services/CreatureObjectService';
import { IServerObject } from '../types';

import { CreatureObjectResolver } from './CreatureObjectResolver';

describe('CreatureObjectResolver', () => {
  let resolver: CreatureObjectResolver;
  let mockService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockService = {
      load: vi.fn().mockResolvedValue(null),
    };

    resolver = new CreatureObjectResolver();
    resolver.creatureObjectService = mockService as unknown as CreatureObjectService;
  });

  describe('scaleFactor', () => {
    it('should return scale factor from loaded object', async () => {
      mockService.load.mockResolvedValue({ SCALE_FACTOR: 1.5 });

      const result = await resolver.scaleFactor(createMockObject('12345'));

      expect(mockService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(1.5);
    });

    it('should return null when object not found', async () => {
      mockService.load.mockResolvedValue(null);

      const result = await resolver.scaleFactor(createMockObject('99999'));

      expect(result).toBeNull();
    });
  });

  describe('states', () => {
    it('should return states from loaded object', async () => {
      mockService.load.mockResolvedValue({ STATES: 123 });

      const result = await resolver.states(createMockObject('12345'));

      expect(result).toBe(123);
    });
  });

  describe('posture', () => {
    it('should return posture from loaded object', async () => {
      mockService.load.mockResolvedValue({ POSTURE: 0 });

      const result = await resolver.posture(createMockObject('12345'));

      expect(result).toBe(0);
    });
  });

  describe('shockWounds', () => {
    it('should return shock wounds from loaded object', async () => {
      mockService.load.mockResolvedValue({ SHOCK_WOUNDS: 50 });

      const result = await resolver.shockWounds(createMockObject('12345'));

      expect(result).toBe(50);
    });
  });

  describe('masterId', () => {
    it('should return master ID from loaded object', async () => {
      mockService.load.mockResolvedValue({ MASTER_ID: 54321 });

      const result = await resolver.masterId(createMockObject('12345'));

      expect(result).toBe(54321);
    });
  });

  describe('rank', () => {
    it('should return rank from loaded object', async () => {
      mockService.load.mockResolvedValue({ RANK: 5 });

      const result = await resolver.rank(createMockObject('12345'));

      expect(result).toBe(5);
    });
  });

  describe('baseWalkSpeed', () => {
    it('should return base walk speed from loaded object', async () => {
      mockService.load.mockResolvedValue({ BASE_WALK_SPEED: 1.0 });

      const result = await resolver.baseWalkSpeed(createMockObject('12345'));

      expect(result).toBe(1.0);
    });
  });

  describe('baseRunSpeed', () => {
    it('should return base run speed from loaded object', async () => {
      mockService.load.mockResolvedValue({ BASE_RUN_SPEED: 5.0 });

      const result = await resolver.baseRunSpeed(createMockObject('12345'));

      expect(result).toBe(5.0);
    });
  });

  describe('attributes', () => {
    it('should return array of attributes from loaded object', async () => {
      // NumberOfAttributes is 6 (Health, Constitution, Action, Stamina, Mind, Willpower)
      mockService.load.mockResolvedValue({
        ATTRIBUTE_0: 1000,
        ATTRIBUTE_1: 800,
        ATTRIBUTE_2: 900,
        ATTRIBUTE_3: 700,
        ATTRIBUTE_4: 750,
        ATTRIBUTE_5: 850,
      });

      const result = await resolver.attributes(createMockObject('12345'));

      expect(result).toEqual([1000, 800, 900, 700, 750, 850]);
    });

    it('should return null when object not found', async () => {
      mockService.load.mockResolvedValue(null);

      const result = await resolver.attributes(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('persistedBuffs', () => {
    it('should return persisted buffs from loaded object', async () => {
      mockService.load.mockResolvedValue({ PERSISTED_BUFFS: 'buff_data' });

      const result = await resolver.persistedBuffs(createMockObject('12345'));

      expect(result).toBe('buff_data');
    });
  });

  describe('worldspaceLocation', () => {
    it('should return location array when all coordinates present', async () => {
      mockService.load.mockResolvedValue({
        WS_X: 100.5,
        WS_Y: 50.0,
        WS_Z: 200.3,
      });

      const result = await resolver.worldspaceLocation(createMockObject('12345'));

      expect(result).toEqual([100.5, 50.0, 200.3]);
    });

    it('should return null when coordinates are missing', async () => {
      mockService.load.mockResolvedValue({
        WS_X: 100.5,
        WS_Y: null,
        WS_Z: 200.3,
      });

      const result = await resolver.worldspaceLocation(createMockObject('12345'));

      expect(result).toBeNull();
    });

    it('should return null when object not found', async () => {
      mockService.load.mockResolvedValue(null);

      const result = await resolver.worldspaceLocation(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });
});
