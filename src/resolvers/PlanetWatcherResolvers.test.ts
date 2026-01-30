import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ServerObjectService } from '../services/ServerObjectService';

import { PlanetWatcherResolvers } from './PlanetWatcherResolvers';

// Mock dns module
vi.mock('dns', () => ({
  promises: {
    reverse: vi.fn().mockResolvedValue(['test-hostname.example.com']),
  },
}));

describe('PlanetWatcherResolvers', () => {
  let resolver: PlanetWatcherResolvers;
  let mockObjectService: { getOne: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    resolver = new PlanetWatcherResolvers(mockObjectService as unknown as ServerObjectService);
  });

  describe('planetWatcherObject', () => {
    it('should transform object update payload', () => {
      const payload = {
        data: [
          {
            networkId: BigInt(12345),
            locationX: 100.5,
            locationZ: 200.3,
            authoritativeServer: 1,
            interestRadius: 50,
            deleteObject: false,
            objectTypeTag: 1234,
            level: 80,
            hibernating: false,
            templateCrc: 987654,
            aiActivity: 0,
            creationType: 1,
          },
        ],
      };

      const args = { planet: 'tatooine' };

      const result = resolver.planetWatcherObject(payload, args as never);

      expect(result).toEqual([
        {
          networkId: '12345',
          location: [100.5, 0, 200.3],
          authoritativeServer: 1,
          interestRadius: 50,
          deleteObject: false,
          objectTypeTag: 1234,
          level: 80,
          hibernating: false,
          templateCrc: 987654,
          aiActivity: 0,
          creationType: 1,
        },
      ]);
    });

    it('should handle multiple objects in payload', () => {
      const payload = {
        data: [
          {
            networkId: BigInt(111),
            locationX: 10,
            locationZ: 20,
            authoritativeServer: 1,
            interestRadius: 30,
            deleteObject: false,
            objectTypeTag: 100,
            level: 1,
            hibernating: true,
            templateCrc: 1000,
            aiActivity: 1,
            creationType: 0,
          },
          {
            networkId: BigInt(222),
            locationX: 50,
            locationZ: 60,
            authoritativeServer: 2,
            interestRadius: 40,
            deleteObject: true,
            objectTypeTag: 200,
            level: 90,
            hibernating: false,
            templateCrc: 2000,
            aiActivity: 2,
            creationType: 1,
          },
        ],
      };

      const result = resolver.planetWatcherObject(payload, { planet: 'naboo' } as never);

      expect(result).toHaveLength(2);
      expect(result[0].networkId).toBe('111');
      expect(result[1].networkId).toBe('222');
    });
  });

  describe('planetWatcherNodeStatus', () => {
    it('should transform node status update payload', () => {
      const payload = {
        data: [
          {
            locationX: 1000,
            locationZ: 2000,
            isLoaded: 1,
            serverCount: 3,
            serverIds: [1, 2, 3],
            subscriptionCount: 5,
            subscriptions: [10, 20, 30, 40, 50],
          },
        ],
      };

      const result = resolver.planetWatcherNodeStatus(payload, { planet: 'tatooine' } as never);

      expect(result[0]).toMatchObject({
        location: [1000, 0, 2000],
        isLoaded: true,
        serverCount: 3,
        serverIds: [1, 2, 3],
        subscriptionCount: 5,
        subscriptions: [10, 20, 30, 40, 50],
      });
      expect(result[0].cellIndex).toBeDefined();
    });

    it('should convert isLoaded 0 to false', () => {
      const payload = {
        data: [
          {
            locationX: 500,
            locationZ: 500,
            isLoaded: 0,
            serverCount: 0,
            serverIds: [],
            subscriptionCount: 0,
            subscriptions: [],
          },
        ],
      };

      const result = resolver.planetWatcherNodeStatus(payload, { planet: 'corellia' } as never);

      expect(result[0].isLoaded).toBe(false);
    });
  });

  describe('planetWatcherGameServerStatus', () => {
    it('should transform game server status payload with DNS lookup', async () => {
      const payload = {
        data: [
          {
            isOnline: 1,
            ipAddress: '192.168.1.1',
            serverId: 5,
            systemPid: 12345,
            sceneId: 'tatooine',
          },
        ],
      };

      const result = await resolver.planetWatcherGameServerStatus(payload, { planet: 'tatooine' } as never);

      expect(result).toEqual([
        {
          isOnline: true,
          ipAddress: '192.168.1.1',
          hostName: 'test-hostname.example.com',
          serverId: 5,
          systemPid: 12345,
          sceneId: 'tatooine',
        },
      ]);
    });

    it('should convert isOnline 0 to false', async () => {
      const payload = {
        data: [
          {
            isOnline: 0,
            ipAddress: '10.0.0.1',
            serverId: 1,
            systemPid: 1000,
            sceneId: 'naboo',
          },
        ],
      };

      const result = await resolver.planetWatcherGameServerStatus(payload, { planet: 'naboo' } as never);

      expect(result[0].isOnline).toBe(false);
    });
  });

  describe('planetWatcherFrameEnd', () => {
    it('should transform frame end payload', () => {
      const payload = {
        data: [
          {
            serverId: 1,
            frameTime: 16.5,
            profilerData: 'profiler_info',
          },
        ],
      };

      const result = resolver.planetWatcherFrameEnd(payload, { planet: 'tatooine' } as never);

      expect(result).toEqual([
        {
          serverId: 1,
          frameTime: 16.5,
          profilerData: 'profiler_info',
        },
      ]);
    });

    it('should handle multiple frame end entries', () => {
      const payload = {
        data: [
          { serverId: 1, frameTime: 15.0, profilerData: 'data1' },
          { serverId: 2, frameTime: 17.5, profilerData: 'data2' },
          { serverId: 3, frameTime: 20.0, profilerData: 'data3' },
        ],
      };

      const result = resolver.planetWatcherFrameEnd(payload, { planet: 'endor' } as never);

      expect(result).toHaveLength(3);
      expect(result[0].serverId).toBe(1);
      expect(result[1].serverId).toBe(2);
      expect(result[2].serverId).toBe(3);
    });
  });
});
