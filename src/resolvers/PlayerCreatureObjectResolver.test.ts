import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CityService } from '../services/CityService';
import { GuildService } from '../services/GuildService';
import { PlayerCreatureObjectService } from '../services/PlayerCreatureObjectService';
import { PropertyListService } from '../services/PropertyListService';
import { ServerObjectService } from '../services/ServerObjectService';
import { SkillService } from '../services/SkillService';
import { StringFileLoader } from '../services/StringFileLoader';
import { PlayerCreatureObject } from '../types';

import { PlayerCreatureObjectResolver } from './PlayerCreatureObjectResolver';

describe('PlayerCreatureObjectResolver', () => {
  let resolver: PlayerCreatureObjectResolver;
  let mockPlayerCreatureService: {
    getPlayerRecordForCharacter: ReturnType<typeof vi.fn>;
    getCheapStructuresForCharacter: ReturnType<typeof vi.fn>;
  };
  let mockObjectService: { getMany: ReturnType<typeof vi.fn> };
  let mockPropertyListService: { load: ReturnType<typeof vi.fn> };
  let mockStringFileService: { load: ReturnType<typeof vi.fn> };
  let mockCityService: { getCityForPlayer: ReturnType<typeof vi.fn> };
  let mockGuildService: { getGuildForPlayer: ReturnType<typeof vi.fn> };
  let mockSkillService: {
    getSkillInformation: ReturnType<typeof vi.fn>;
    getLevelForPlayer: ReturnType<typeof vi.fn>;
  };

  const createMockObject = (id: string): PlayerCreatureObject =>
    ({
      id,
    }) as PlayerCreatureObject;

  beforeEach(() => {
    mockPlayerCreatureService = {
      getPlayerRecordForCharacter: vi.fn().mockResolvedValue(null),
      getCheapStructuresForCharacter: vi.fn().mockResolvedValue([]),
    };

    mockObjectService = {
      getMany: vi.fn().mockResolvedValue([]),
    };

    mockPropertyListService = {
      load: vi.fn().mockResolvedValue([]),
    };

    mockStringFileService = {
      load: vi.fn().mockResolvedValue({}),
    };

    mockCityService = {
      getCityForPlayer: vi.fn().mockResolvedValue(null),
    };

    mockGuildService = {
      getGuildForPlayer: vi.fn().mockResolvedValue(null),
    };

    mockSkillService = {
      getSkillInformation: vi.fn().mockResolvedValue(null),
      getLevelForPlayer: vi.fn().mockResolvedValue(1),
    };

    resolver = new PlayerCreatureObjectResolver();
    resolver.playerCreatureObjectService = mockPlayerCreatureService as unknown as PlayerCreatureObjectService;
    resolver.objectService = mockObjectService as unknown as ServerObjectService;
    resolver.propertyListService = mockPropertyListService as unknown as PropertyListService;
    resolver.stringFileService = mockStringFileService as unknown as StringFileLoader;
    resolver.cityService = mockCityService as unknown as CityService;
    resolver.guildService = mockGuildService as unknown as GuildService;
    resolver.skillService = mockSkillService as unknown as SkillService;
  });

  describe('ownedObjects', () => {
    it('should fetch owned objects for character', async () => {
      const mockObjects = [{ id: '111' }, { id: '222' }];
      mockObjectService.getMany.mockResolvedValue(mockObjects);

      const result = await resolver.ownedObjects(createMockObject('12345'), null, true, false);

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        ownedBy: ['12345'],
        objectTypes: null,
        excludeDeleted: true,
      });
      expect(result).toEqual(mockObjects);
    });

    it('should filter by object types when provided', async () => {
      mockObjectService.getMany.mockResolvedValue([]);

      await resolver.ownedObjects(createMockObject('12345'), [1, 2, 3], false, false);

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        ownedBy: ['12345'],
        objectTypes: [1, 2, 3],
        excludeDeleted: false,
      });
    });
  });

  describe('account', () => {
    it('should return account object with station ID', async () => {
      mockPlayerCreatureService.getPlayerRecordForCharacter.mockResolvedValue({ STATION_ID: 12345 });

      const result = await resolver.account(createMockObject('12345'));

      expect(mockPlayerCreatureService.getPlayerRecordForCharacter).toHaveBeenCalledWith('12345');
      expect(result).toEqual({ id: 12345 });
    });

    it('should return null when player record not found', async () => {
      mockPlayerCreatureService.getPlayerRecordForCharacter.mockResolvedValue(null);

      const result = await resolver.account(createMockObject('12345'));

      expect(result).toBeNull();
    });

    it('should return null when STATION_ID is missing', async () => {
      mockPlayerCreatureService.getPlayerRecordForCharacter.mockResolvedValue({});

      const result = await resolver.account(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('lastLoginTime', () => {
    it('should return last login time as ISO string', async () => {
      const loginTime = new Date('2024-01-15T10:30:00Z');
      mockPlayerCreatureService.getPlayerRecordForCharacter.mockResolvedValue({ LAST_LOGIN_TIME: loginTime });

      const result = await resolver.lastLoginTime(createMockObject('12345'));

      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should return null when player record not found', async () => {
      mockPlayerCreatureService.getPlayerRecordForCharacter.mockResolvedValue(null);

      const result = await resolver.lastLoginTime(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('createdTime', () => {
    it('should return create time as ISO string', async () => {
      const createTime = new Date('2023-06-01T08:00:00Z');
      mockPlayerCreatureService.getPlayerRecordForCharacter.mockResolvedValue({ CREATE_TIME: createTime });

      const result = await resolver.createdTime(createMockObject('12345'));

      expect(result).toBe('2023-06-01T08:00:00.000Z');
    });
  });

  describe('skills', () => {
    it('should fetch and resolve skills from property lists', async () => {
      mockPropertyListService.load.mockResolvedValue([
        { value: 'combat_brawler_novice' },
        { value: 'combat_marksman_novice' },
      ]);
      mockSkillService.getSkillInformation.mockResolvedValueOnce({ name: 'Novice Brawler' });
      mockSkillService.getSkillInformation.mockResolvedValueOnce({ name: 'Novice Marksman' });

      const result = await resolver.skills(createMockObject('12345'));

      expect(mockPropertyListService.load).toHaveBeenCalled();
      expect(mockSkillService.getSkillInformation).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should filter out null skills', async () => {
      mockPropertyListService.load.mockResolvedValue([{ value: 'skill1' }, { value: 'skill2' }]);
      mockSkillService.getSkillInformation.mockResolvedValueOnce({ name: 'Skill 1' });
      mockSkillService.getSkillInformation.mockResolvedValueOnce(null);

      const result = await resolver.skills(createMockObject('12345'));

      expect(result).toHaveLength(1);
    });
  });

  describe('level', () => {
    it('should calculate level from skills and player object', async () => {
      mockPropertyListService.load.mockResolvedValue([]);
      mockObjectService.getMany.mockResolvedValue([{ id: '999' }]);
      mockSkillService.getLevelForPlayer.mockResolvedValue(90);

      const result = await resolver.level(createMockObject('12345'));

      expect(mockSkillService.getLevelForPlayer).toHaveBeenCalled();
      expect(result).toBe(90);
    });
  });

  describe('city', () => {
    it('should fetch city for player', async () => {
      const mockCity = { id: '42', name: 'Test City' };
      mockCityService.getCityForPlayer.mockResolvedValue(mockCity);

      const result = await resolver.city(createMockObject('12345'));

      expect(mockCityService.getCityForPlayer).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockCity);
    });

    it('should return null when player has no city', async () => {
      mockCityService.getCityForPlayer.mockResolvedValue(null);

      const result = await resolver.city(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('guild', () => {
    it('should fetch guild for player', async () => {
      const mockGuild = { id: '100', name: 'Test Guild' };
      mockGuildService.getGuildForPlayer.mockResolvedValue(mockGuild);

      const result = await resolver.guild(createMockObject('12345'));

      expect(mockGuildService.getGuildForPlayer).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockGuild);
    });

    it('should return null when player has no guild', async () => {
      mockGuildService.getGuildForPlayer.mockResolvedValue(null);

      const result = await resolver.guild(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('playerObject', () => {
    it('should fetch player object contained by character', async () => {
      const mockPlayerObject = { id: '999', name: 'Player Object' };
      mockObjectService.getMany.mockResolvedValue([mockPlayerObject]);

      const result = await resolver.playerObject(createMockObject('12345'));

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        containedById: '12345',
        objectTypes: expect.arrayContaining([expect.any(Number)]),
      });
      expect(result).toEqual(mockPlayerObject);
    });

    it('should throw error when no player object found', async () => {
      mockObjectService.getMany.mockResolvedValue([]);

      await expect(resolver.playerObject(createMockObject('12345'))).rejects.toThrow(
        'Character 12345 with no player object is invalid!'
      );
    });
  });
});
