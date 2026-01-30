import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PlayerObjectService } from '../services/PlayerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { IServerObject } from '../types';

import { PlayerObjectResolver } from './PlayerObjectResolver';

describe('PlayerObjectResolver', () => {
  let resolver: PlayerObjectResolver;
  let mockPlayerObjectService: { load: ReturnType<typeof vi.fn> };
  let mockStringFileService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockPlayerObjectService = {
      load: vi.fn().mockResolvedValue(null),
    };

    mockStringFileService = {
      load: vi.fn().mockResolvedValue({}),
    };

    resolver = new PlayerObjectResolver(
      mockPlayerObjectService as unknown as PlayerObjectService,
      mockStringFileService as unknown as StringFileLoader
    );
  });

  describe('stationId', () => {
    it('should return station ID from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ STATION_ID: 12345 });

      const result = await resolver.stationId(createMockObject('12345'));

      expect(mockPlayerObjectService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(12345);
    });

    it('should return null when object not found', async () => {
      mockPlayerObjectService.load.mockResolvedValue(null);

      const result = await resolver.stationId(createMockObject('99999'));

      expect(result).toBeNull();
    });
  });

  describe('personalProfileId', () => {
    it('should return personal profile ID from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ PERSONAL_PROFILE_ID: 'profile123' });

      const result = await resolver.personalProfileId(createMockObject('12345'));

      expect(result).toBe('profile123');
    });
  });

  describe('characterProfileId', () => {
    it('should return character profile ID from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ CHARACTER_PROFILE_ID: 'charprofile456' });

      const result = await resolver.characterProfileId(createMockObject('12345'));

      expect(result).toBe('charprofile456');
    });
  });

  describe('skillTitle', () => {
    it('should return skill title from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ SKILL_TITLE: 'Master Artisan' });

      const result = await resolver.skillTitle(createMockObject('12345'));

      expect(result).toBe('Master Artisan');
    });

    it('should return null when skill title is empty', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ SKILL_TITLE: '   ' });

      const result = await resolver.skillTitle(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('bornDate', () => {
    it('should return born date from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ BORN_DATE: 1234567890 });

      const result = await resolver.bornDate(createMockObject('12345'));

      expect(result).toBe(1234567890);
    });
  });

  describe('playedTime', () => {
    it('should return played time from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ PLAYED_TIME: 3600 });

      const result = await resolver.playedTime(createMockObject('12345'));

      expect(result).toBe(3600);
    });
  });

  describe('forceRegenRate', () => {
    it('should return force regen rate from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ FORCE_REGEN_RATE: 10 });

      const result = await resolver.forceRegenRate(createMockObject('12345'));

      expect(result).toBe(10);
    });
  });

  describe('forcePower', () => {
    it('should return force power from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ FORCE_POWER: 500 });

      const result = await resolver.forcePower(createMockObject('12345'));

      expect(result).toBe(500);
    });
  });

  describe('maxForcePower', () => {
    it('should return max force power from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ MAX_FORCE_POWER: 1000 });

      const result = await resolver.maxForcePower(createMockObject('12345'));

      expect(result).toBe(1000);
    });
  });

  describe('numLots', () => {
    it('should return number of lots from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ NUM_LOTS: 10 });

      const result = await resolver.numLots(createMockObject('12345'));

      expect(result).toBe(10);
    });
  });

  describe('activeQuests', () => {
    it('should return active quests from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ ACTIVE_QUESTS: 'quest_data' });

      const result = await resolver.activeQuests(createMockObject('12345'));

      expect(result).toBe('quest_data');
    });
  });

  describe('completedQuests', () => {
    it('should return completed quests from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ COMPLETED_QUESTS: 'completed_data' });

      const result = await resolver.completedQuests(createMockObject('12345'));

      expect(result).toBe('completed_data');
    });
  });

  describe('currentQuest', () => {
    it('should return current quest from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ CURRENT_QUEST: 'current_quest_id' });

      const result = await resolver.currentQuest(createMockObject('12345'));

      expect(result).toBe('current_quest_id');
    });
  });

  describe('quests', () => {
    it('should join all QUESTS fields', async () => {
      mockPlayerObjectService.load.mockResolvedValue({
        QUESTS: 'part1',
        QUESTS_0: 'part2',
        QUESTS_1: 'part3',
      });

      const result = await resolver.quests(createMockObject('12345'));

      expect(result).toBe('part1part2part3');
    });

    it('should return null when object not found', async () => {
      mockPlayerObjectService.load.mockResolvedValue(null);

      const result = await resolver.quests(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('roleIconChoice', () => {
    it('should return role icon choice from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ ROLE_ICON_CHOICE: 3 });

      const result = await resolver.roleIconChoice(createMockObject('12345'));

      expect(result).toBe(3);
    });
  });

  describe('skillTemplate', () => {
    it('should return resolved skill template name', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ SKILL_TEMPLATE: 'force_sensitive_1a' });
      mockStringFileService.load.mockResolvedValue({
        // eslint-disable-next-line camelcase
        force_sensitive_1a: 'Jedi Guardian',
      });

      const result = await resolver.skillTemplate(createMockObject('12345'));

      expect(mockStringFileService.load).toHaveBeenCalledWith('ui_roadmap');
      expect(result).toBe('Jedi Guardian');
    });

    it('should return template ID when not in string file', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ SKILL_TEMPLATE: 'unknown_template' });
      mockStringFileService.load.mockResolvedValue({});

      const result = await resolver.skillTemplate(createMockObject('12345'));

      expect(result).toBe('unknown_template');
    });
  });

  describe('workingSkill', () => {
    it('should return resolved working skill name', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ WORKING_SKILL: 'crafting_artisan_master' });
      mockStringFileService.load.mockResolvedValue({
        // eslint-disable-next-line camelcase
        crafting_artisan_master: 'Master Artisan',
      });

      const result = await resolver.workingSkill(createMockObject('12345'));

      expect(mockStringFileService.load).toHaveBeenCalledWith('skl_t');
      expect(result).toBe('Master Artisan');
    });
  });

  describe('currentGcwPoints', () => {
    it('should return current GCW points from loaded object', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ CURRENT_GCW_POINTS: 1000 });

      const result = await resolver.currentGcwPoints(createMockObject('12345'));

      expect(result).toBe(1000);
    });
  });

  describe('showBackpack', () => {
    it('should return true when SHOW_BACKPACK is Y', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ SHOW_BACKPACK: 'Y' });

      const result = await resolver.showBackpack(createMockObject('12345'));

      expect(result).toBe(true);
    });

    it('should return false when SHOW_BACKPACK is not Y', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ SHOW_BACKPACK: 'N' });

      const result = await resolver.showBackpack(createMockObject('12345'));

      expect(result).toBe(false);
    });
  });

  describe('showHelmet', () => {
    it('should return true when SHOW_HELMET is Y', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ SHOW_HELMET: 'Y' });

      const result = await resolver.showHelmet(createMockObject('12345'));

      expect(result).toBe(true);
    });

    it('should return false when SHOW_HELMET is not Y', async () => {
      mockPlayerObjectService.load.mockResolvedValue({ SHOW_HELMET: 'N' });

      const result = await resolver.showHelmet(createMockObject('12345'));

      expect(result).toBe(false);
    });
  });

  describe('resolvedName', () => {
    it('should always return Player Object', () => {
      const result = resolver.resolvedName(createMockObject('12345'), true);

      expect(result).toBe('Player Object');
    });
  });

  describe('collections', () => {
    it('should join all COLLECTIONS fields', async () => {
      mockPlayerObjectService.load.mockResolvedValue({
        COLLECTIONS: 'coll1',
        COLLECTIONS_0: 'coll2',
      });

      const result = await resolver.collections(createMockObject('12345'));

      expect(result).toBe('coll1coll2');
    });
  });
});
