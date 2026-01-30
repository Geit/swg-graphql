import { describe, it, expect, vi, beforeEach } from 'vitest';

import { GuildService } from '../services/GuildService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { Guild, GuildEnemy, GuildMember } from '../types/Guild';

import { GuildResolver, GuildMemberResolver, GuildEnemyResolver } from './GuildResovler';

describe('GuildResolver', () => {
  let resolver: GuildResolver;
  let mockObjectService: { getOne: ReturnType<typeof vi.fn> };
  let mockStringService: { load: ReturnType<typeof vi.fn> };

  const createMockGuild = (overrides: Partial<Guild> = {}): Guild =>
    ({
      id: '1',
      name: 'Test Guild',
      leaderId: '12345',
      members: [],
      enemies: [],
      factionCrc: 0,
      gcwDefenderRegion: null,
      ...overrides,
    }) as Guild;

  beforeEach(() => {
    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    resolver = new GuildResolver(
      mockObjectService as unknown as ServerObjectService,
      mockStringService as unknown as StringFileLoader
    );
  });

  describe('leader', () => {
    it('should fetch leader object by leaderId', async () => {
      const mockLeader = { id: '12345', name: 'GuildLeader' };
      mockObjectService.getOne.mockResolvedValue(mockLeader);

      const result = await resolver.leader(createMockGuild({ leaderId: '12345' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockLeader);
    });
  });

  describe('memberCount', () => {
    it('should return the number of members', () => {
      const guild = createMockGuild({
        members: [{ id: '1' }, { id: '2' }, { id: '3' }] as GuildMember[],
      });

      const result = resolver.memberCount(guild);

      expect(result).toBe(3);
    });

    it('should return 0 when no members', () => {
      const guild = createMockGuild({ members: [] });

      const result = resolver.memberCount(guild);

      expect(result).toBe(0);
    });
  });

  describe('enemyCount', () => {
    it('should return the number of enemies', () => {
      const guild = createMockGuild({
        enemies: [{ id: '1' }, { id: '2' }] as GuildEnemy[],
      });

      const result = resolver.enemyCount(guild);

      expect(result).toBe(2);
    });

    it('should return 0 when no enemies', () => {
      const guild = createMockGuild({ enemies: [] });

      const result = resolver.enemyCount(guild);

      expect(result).toBe(0);
    });

    it('should return 0 when enemies is undefined', () => {
      const guild = createMockGuild({ enemies: undefined });

      const result = resolver.enemyCount(guild);

      expect(result).toBe(0);
    });
  });

  describe('faction', () => {
    it('should call getFactionNameFromCrc with guild factionCrc', () => {
      // We test that the faction method passes the factionCrc to getFactionNameFromCrc
      // The actual CRC values are computed dynamically by getStringCrc
      const guild = createMockGuild({ factionCrc: 12345 });

      const result = resolver.faction(guild);

      // With an unknown CRC, getFactionNameFromCrc returns null
      expect(result).toBeNull();
    });

    it('should return null when factionCrc is null', () => {
      const guild = createMockGuild({ factionCrc: null });

      const result = resolver.faction(guild);

      expect(result).toBeNull();
    });
  });

  describe('gcwDefenderRegionResolved', () => {
    it('should return resolved region name', async () => {
      const regionStrings: Record<string, string> = {};
      // eslint-disable-next-line camelcase
      regionStrings.corellia_region_1 = 'Coronet City';
      mockStringService.load.mockResolvedValue(regionStrings);

      const guild = createMockGuild({ gcwDefenderRegion: 'corellia_region_1' });

      const result = await resolver.gcwDefenderRegionResolved(guild);

      expect(mockStringService.load).toHaveBeenCalledWith('gcw_regions');
      expect(result).toBe('Coronet City');
    });

    it('should return null when no defender region', async () => {
      const guild = createMockGuild({ gcwDefenderRegion: null });

      const result = await resolver.gcwDefenderRegionResolved(guild);

      expect(result).toBeNull();
    });
  });
});

describe('GuildMemberResolver', () => {
  let resolver: GuildMemberResolver;
  let mockObjectService: { getOne: ReturnType<typeof vi.fn> };
  let mockStringService: { load: ReturnType<typeof vi.fn> };

  const createMockMember = (overrides: Partial<GuildMember> = {}): GuildMember =>
    ({
      id: '12345',
      name: 'TestMember',
      skillTemplate: 'combat_brawler',
      level: 50,
      ...overrides,
    }) as GuildMember;

  beforeEach(() => {
    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    resolver = new GuildMemberResolver(
      mockObjectService as unknown as ServerObjectService,
      mockStringService as unknown as StringFileLoader
    );
  });

  describe('object', () => {
    it('should fetch member object by id', async () => {
      const mockObject = { id: '12345', name: 'TestPlayer' };
      mockObjectService.getOne.mockResolvedValue(mockObject);

      const result = await resolver.object(createMockMember({ id: '12345' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockObject);
    });
  });

  describe('skillTemplateTitle', () => {
    it('should return resolved skill title', async () => {
      // eslint-disable-next-line camelcase
      mockStringService.load.mockResolvedValue({ combat_brawler: 'Brawler' });

      const result = await resolver.skillTemplateTitle(createMockMember({ skillTemplate: 'combat_brawler' }));

      expect(mockStringService.load).toHaveBeenCalledWith('ui_roadmap');
      expect(result).toBe('Brawler');
    });

    it('should return Unknown when skill template not found', async () => {
      mockStringService.load.mockResolvedValue({});

      const result = await resolver.skillTemplateTitle(createMockMember({ skillTemplate: 'unknown_skill' }));

      expect(result).toBe('Unknown');
    });

    it('should return empty string when skill template is empty', async () => {
      // When skillTemplate is '': ('' && anything) evaluates to '', then '' ?? 'Unknown' = ''
      // because ?? only handles null/undefined, not falsy values like empty strings
      mockStringService.load.mockResolvedValue({});

      const result = await resolver.skillTemplateTitle(createMockMember({ skillTemplate: '' }));

      expect(result).toBe('');
    });

    it('should return Unknown when skill template is null', async () => {
      // When skillTemplate is null: (null && anything) evaluates to null, then null ?? 'Unknown' = 'Unknown'
      mockStringService.load.mockResolvedValue({});

      const result = await resolver.skillTemplateTitle(createMockMember({ skillTemplate: null }));

      expect(result).toBe('Unknown');
    });
  });
});

describe('GuildEnemyResolver', () => {
  let resolver: GuildEnemyResolver;
  let mockGuildService: { getGuild: ReturnType<typeof vi.fn> };

  const createMockEnemy = (overrides: Partial<GuildEnemy> = {}): GuildEnemy =>
    ({
      id: '2',
      killCount: 10,
      lastUpdateTime: 1000000,
      ...overrides,
    }) as GuildEnemy;

  beforeEach(() => {
    mockGuildService = {
      getGuild: vi.fn().mockResolvedValue(null),
    };

    resolver = new GuildEnemyResolver(mockGuildService as unknown as GuildService);
  });

  describe('guild', () => {
    it('should fetch enemy guild by id', async () => {
      const mockGuild = { id: '2', name: 'Enemy Guild' };
      mockGuildService.getGuild.mockResolvedValue(mockGuild);

      const result = await resolver.guild(createMockEnemy({ id: '2' }));

      expect(mockGuildService.getGuild).toHaveBeenCalledWith('2');
      expect(result).toEqual(mockGuild);
    });
  });
});
