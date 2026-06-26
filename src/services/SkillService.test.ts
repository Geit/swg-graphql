import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DataTableService } from './DataTableService';
import { SkillService } from './SkillService';
import { StringFileLoader } from './StringFileLoader';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('SkillService', () => {
  let service: SkillService;
  let mockDataTableService: { load: ReturnType<typeof vi.fn> };
  let mockStringService: { load: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tracker.reset();

    // Empty datatable/string-map defaults for every file the service loads.
    mockDataTableService = {
      load: vi.fn().mockResolvedValue([]),
    };

    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    service = new SkillService(
      mockDataTableService as unknown as DataTableService,
      mockStringService as unknown as StringFileLoader
    );
  });

  describe('getSkillInformation', () => {
    it('should return null for unknown skill', async () => {
      const result = await service.getSkillInformation('unknown_skill');

      expect(result).toBeNull();
    });

    it('should return skill data with enriched information', async () => {
      const skillId = 'combat_brawler_novice';

      const skillRow = {
        name: skillId,
        parent: '',
        graphType: 0,
        godOnly: false,
        isTitle: false,
        isProfession: true,
        isHidden: false,
        moneyRequired: 0,
        pointsRequired: 0,
        skillsRequiredCount: 0,
        skillsRequired: '',
        preclusionSkills: '',
        xpType: 'combat_general',
        xpCost: 0,
        xpCap: 1000,
        missionsRequired: '',
        apprenticeshipsRequired: '',
        statsRequired: '',
        speciesRequired: '',
        jediStateRequired: 0,
        skillAbility: '',
        commands: 'berserk1,taunt',
        skillMods: 'brawler_accuracy=10,brawler_damage=5',
        schematicsGranted: '',
        schematicsRevoked: '',
        searchable: true,
        ender: 0,
      };

      mockDataTableService.load
        .mockReset()
        .mockImplementation(({ fileName }) => Promise.resolve(fileName === 'skill/skills.iff' ? [skillRow] : []));

      const stringsByFile = new Map<string, Record<string, string>>([
        ['skl_n', { [skillId]: 'Novice Brawler' }],
        ['skl_t', { [skillId]: 'Brawler' }],
        ['skl_d', { [skillId]: 'A novice brawler skill' }],
        ['cmd_n', { berserk1: 'Berserk', taunt: 'Taunt' }],
        [
          'stat_n',
          Object.fromEntries([
            ['brawler_accuracy', 'Brawler Accuracy'],
            ['brawler_damage', 'Brawler Damage'],
          ]),
        ],
      ]);
      mockStringService.load
        .mockReset()
        .mockImplementation((fileName: string) => Promise.resolve(stringsByFile.get(fileName) ?? {}));

      // Create a new service with the new mocks
      const testService = new SkillService(
        mockDataTableService as unknown as DataTableService,
        mockStringService as unknown as StringFileLoader
      );

      // Wait for loading to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await testService.getSkillInformation(skillId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(skillId);
      expect(result?.name).toBe('Novice Brawler');
      expect(result?.title).toBe('Brawler');
      expect(result?.description).toBe('A novice brawler skill');
      expect(result?.commands).toEqual([
        { id: 'berserk1', name: 'Berserk' },
        { id: 'taunt', name: 'Taunt' },
      ]);
      expect(result?.skillMods).toEqual([
        { id: 'brawler_accuracy', name: 'Brawler Accuracy', value: 10 },
        { id: 'brawler_damage', name: 'Brawler Damage', value: 5 },
      ]);
    });
  });

  describe('getExperiencePointsForObject', () => {
    it('should return experience points for an object', async () => {
      const mockXpRecords = [
        { OBJECT_ID: 12345, EXPERIENCE_TYPE: 'combat_general', POINTS: 5000 },
        { OBJECT_ID: 12345, EXPERIENCE_TYPE: 'crafting', POINTS: 3000 },
      ];
      tracker.on.select('EXPERIENCE_POINTS').response(mockXpRecords);

      const result = await service.getExperiencePointsForObject('12345');

      const query = tracker.history.select[0];
      expect(query.sql).toContain('EXPERIENCE_POINTS');
      expect(result).toHaveLength(2);
      expect(result[0].experienceType).toBe('combat_general');
      expect(result[0].points).toBe(5000);
    });

    it('should return empty array when no experience points found', async () => {
      tracker.on.select('EXPERIENCE_POINTS').response([]);

      const result = await service.getExperiencePointsForObject('99999');

      expect(result).toEqual([]);
    });
  });

  describe('getLevelForPlayer', () => {
    it('should calculate level based on XP', async () => {
      const levelData = [
        {
          level: 1,
          xpRequired: 0,
          xpType: 'combat_general',
          xpMultiplier: 1,
          healthGranted: 100,
          expertisePoints: 0,
        },
        {
          level: 2,
          xpRequired: 1000,
          xpType: 'combat_general',
          xpMultiplier: 1,
          healthGranted: 100,
          expertisePoints: 1,
        },
        {
          level: 3,
          xpRequired: 3000,
          xpType: 'combat_general',
          xpMultiplier: 1,
          healthGranted: 100,
          expertisePoints: 1,
        },
      ];

      mockDataTableService.load
        .mockReset()
        .mockImplementation(({ fileName }) => Promise.resolve(fileName === 'player/player_level.iff' ? levelData : []));

      mockStringService.load.mockReset().mockResolvedValue({});

      const testService = new SkillService(
        mockDataTableService as unknown as DataTableService,
        mockStringService as unknown as StringFileLoader
      );

      // Wait for loading
      await new Promise(resolve => setTimeout(resolve, 10));

      // Mock XP query
      tracker.on
        .select('EXPERIENCE_POINTS')
        .response([{ OBJECT_ID: 12345, EXPERIENCE_TYPE: 'combat_general', POINTS: 2000 }]);

      const level = await testService.getLevelForPlayer([], '12345');

      expect(level).toBe(2); // 2000 XP should be level 2
    });
  });
});
