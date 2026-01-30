import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RootResolver } from './RootResolverCoalitions';

describe('RootResolverCoalitions', () => {
  let resolver: RootResolver;
  let mockGuildService: { getAllGuilds: ReturnType<typeof vi.fn>; getGuild: ReturnType<typeof vi.fn> };
  let mockCityService: { getAllCities: ReturnType<typeof vi.fn>; getCity: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockGuildService = {
      getAllGuilds: vi.fn().mockResolvedValue(new Map()),
      getGuild: vi.fn().mockResolvedValue(null),
    };

    mockCityService = {
      getAllCities: vi.fn().mockResolvedValue(new Map()),
      getCity: vi.fn().mockResolvedValue(null),
    };

    resolver = new RootResolver();
    // Inject mocks
    (resolver as unknown as { guildService: typeof mockGuildService }).guildService = mockGuildService;
    (resolver as unknown as { cityService: typeof mockCityService }).cityService = mockCityService;
  });

  describe('guilds', () => {
    it('should fetch guilds with pagination', async () => {
      const mockGuilds = new Map([
        ['1', { id: '1', name: 'Guild 1' }],
        ['2', { id: '2', name: 'Guild 2' }],
        ['3', { id: '3', name: 'Guild 3' }],
      ]);
      mockGuildService.getAllGuilds.mockResolvedValue(mockGuilds);

      const result = await resolver.guilds(2, 0);

      expect(mockGuildService.getAllGuilds).toHaveBeenCalled();
      expect(result.totalResults).toBe(3);
      expect(result.results).toHaveLength(2);
    });

    it('should apply offset correctly', async () => {
      const mockGuilds = new Map([
        ['1', { id: '1', name: 'Guild 1' }],
        ['2', { id: '2', name: 'Guild 2' }],
        ['3', { id: '3', name: 'Guild 3' }],
      ]);
      mockGuildService.getAllGuilds.mockResolvedValue(mockGuilds);

      const result = await resolver.guilds(2, 1);

      expect(result.totalResults).toBe(3);
      expect(result.results).toHaveLength(2);
    });

    it('should throw error for invalid limit', async () => {
      await expect(resolver.guilds(2000, 0)).rejects.toThrow('Bad `limit` argument');
      await expect(resolver.guilds(-1, 0)).rejects.toThrow('Bad `limit` argument');
    });

    it('should throw error for invalid offset', async () => {
      await expect(resolver.guilds(50, -1)).rejects.toThrow('Bad `offset` argument');
    });
  });

  describe('guild', () => {
    it('should fetch single guild by id', async () => {
      const mockGuild = { id: '1', name: 'Test Guild' };
      mockGuildService.getGuild.mockResolvedValue(mockGuild);

      const result = await resolver.guild('1');

      expect(mockGuildService.getGuild).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockGuild);
    });
  });

  describe('cities', () => {
    it('should fetch cities with pagination', async () => {
      const mockCities = new Map([
        ['1', { id: '1', name: 'City 1' }],
        ['2', { id: '2', name: 'City 2' }],
      ]);
      mockCityService.getAllCities.mockResolvedValue(mockCities);

      const result = await resolver.cities(50, 0);

      expect(mockCityService.getAllCities).toHaveBeenCalled();
      expect(result.totalResults).toBe(2);
      expect(result.results).toHaveLength(2);
    });

    it('should throw error for invalid limit', async () => {
      await expect(resolver.cities(2000, 0)).rejects.toThrow('Bad `limit` argument');
      await expect(resolver.cities(-1, 0)).rejects.toThrow('Bad `limit` argument');
    });

    it('should throw error for invalid offset', async () => {
      await expect(resolver.cities(50, -1)).rejects.toThrow('Bad `offset` argument');
    });
  });

  describe('city', () => {
    it('should fetch single city by id', async () => {
      const mockCity = { id: '1', name: 'Test City' };
      mockCityService.getCity.mockResolvedValue(mockCity);

      const result = await resolver.city('1');

      expect(mockCityService.getCity).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCity);
    });
  });
});
