import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PropertyListIds } from '../types/PropertyList';

import { GuildService } from './GuildService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

// Mock the config module
vi.mock('../config', () => ({
  GUILD_UPDATE_INTERVAL: 0, // Set to 0 for immediate updates in tests
}));

describe('GuildService', () => {
  let service: GuildService;
  let mockPropertyListService: { load: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tracker.reset();

    mockPropertyListService = {
      load: vi.fn().mockResolvedValue([]),
    };

    service = new GuildService();
    // Inject the mock property list service
    (service as unknown as { propertyListService: typeof mockPropertyListService }).propertyListService =
      mockPropertyListService;
  });

  describe('getAllGuilds', () => {
    it('should return empty map when no guild objects found', async () => {
      tracker.on.select('GUILD_OBJECTS').response(null);

      const result = await service.getAllGuilds();

      expect(result.size).toBe(0);
    });

    it('should parse v3 guild format correctly', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: 'v3:1:Test Guild:1000:2000:12345:3000:region1:4000:5000',
        },
      ]);

      const result = await service.getAllGuilds();

      expect(result.size).toBe(1);
      const guild = result.get('1');
      expect(guild?.name).toBe('Test Guild');
      expect(guild?.electionPreviousEndTime).toBe(1000);
      expect(guild?.electionNextEndTime).toBe(2000);
      expect(guild?.factionCrc).toBe(12345);
      expect(guild?.gcwDefenderRegion).toBe('region1');
    });

    it('should parse v2 guild format correctly', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: 'v2:1:Old Guild:1000:2000',
        },
      ]);

      const result = await service.getAllGuilds();

      expect(result.size).toBe(1);
      const guild = result.get('1');
      expect(guild?.name).toBe('Old Guild');
      expect(guild?.electionPreviousEndTime).toBe(1000);
      expect(guild?.electionNextEndTime).toBe(2000);
    });

    it('should parse v1 guild format correctly', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: '1:Simple Guild',
        },
      ]);

      const result = await service.getAllGuilds();

      expect(result.size).toBe(1);
      const guild = result.get('1');
      expect(guild?.name).toBe('Simple Guild');
    });

    it('should parse guild abbreviations', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: '1:Test Guild',
        },
        {
          listId: PropertyListIds.GuildAbbrevs,
          value: '1:TG',
        },
      ]);

      const result = await service.getAllGuilds();

      const guild = result.get('1');
      expect(guild?.abbreviation).toBe('TG');
    });

    it('should parse guild leaders', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: '1:Test Guild',
        },
        {
          listId: PropertyListIds.GuildLeaders,
          value: '1:555',
        },
      ]);

      const result = await service.getAllGuilds();

      const guild = result.get('1');
      expect(guild?.leaderId).toBe('555');
    });

    it('should parse v2 guild members', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: '1:Test Guild',
        },
        {
          listId: PropertyListIds.GuildMembers,
          value: 'v2:1:555:PlayerName:combat_brawler:50:15:Title:666:Rank1',
        },
      ]);

      const result = await service.getAllGuilds();

      const guild = result.get('1');
      expect(guild?.members).toHaveLength(1);
      expect(guild?.members?.[0].id).toBe('555');
      expect(guild?.members?.[0].name).toBe('PlayerName');
      expect(guild?.members?.[0].skillTemplate).toBe('combat_brawler');
      expect(guild?.members?.[0].level).toBe(50);
    });

    it('should parse v2 guild enemies', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: '1:Test Guild',
        },
        {
          listId: PropertyListIds.GuildEnemies,
          value: 'v2:1:2:10:1000000',
        },
      ]);

      const result = await service.getAllGuilds();

      const guild = result.get('1');
      expect(guild?.enemies).toHaveLength(1);
      expect(guild?.enemies?.[0].id).toBe('2');
      expect(guild?.enemies?.[0].killCount).toBe(10);
      expect(guild?.enemies?.[0].lastUpdateTime).toBe(1000000);
    });
  });

  describe('getGuild', () => {
    it('should return guild by id', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: '1:Test Guild',
        },
      ]);

      const result = await service.getGuild('1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Guild');
    });

    it('should return null for non-existent guild', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([]);

      const result = await service.getGuild('999');

      expect(result).toBeNull();
    });
  });

  describe('getGuildForPlayer', () => {
    it('should return guild for a member', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: '1:Test Guild',
        },
        {
          listId: PropertyListIds.GuildMembers,
          value: 'v2:1:555:PlayerName:combat_brawler:50:15:Title:666:Rank1',
        },
      ]);

      const result = await service.getGuildForPlayer('555');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Guild');
    });

    it('should return null for non-member', async () => {
      tracker.on.select('GUILD_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.GuildNames,
          value: '1:Test Guild',
        },
      ]);

      const result = await service.getGuildForPlayer('999');

      expect(result).toBeNull();
    });
  });
});
