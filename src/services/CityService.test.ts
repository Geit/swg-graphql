import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PropertyListIds } from '../types/PropertyList';

import { CityService } from './CityService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

// Mock the config module
vi.mock('../config', () => ({
  CITY_UPDATE_INTERVAL: 0, // Set to 0 for immediate updates in tests
}));

describe('CityService', () => {
  let service: CityService;
  let mockPropertyListService: { load: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tracker.reset();

    mockPropertyListService = {
      load: vi.fn().mockResolvedValue([]),
    };

    service = new CityService();
    // Inject the mock property list service
    (service as unknown as { propertyListService: typeof mockPropertyListService }).propertyListService =
      mockPropertyListService;
  });

  describe('getAllCities', () => {
    it('should return empty map when no city objects found', async () => {
      tracker.on.select('CITY_OBJECTS').response(null);

      const result = await service.getAllCities();

      expect(result.size).toBe(0);
    });

    it('should parse v2 city format correctly', async () => {
      tracker.on.select('CITY_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.Cities,
          value: 'v2:1:Test City:111:tatooine:100:200:500:1000000:222:5:10:3:50:60:70:100:1:80:90:100:0:0:0:333:444',
        },
      ]);

      const result = await service.getAllCities();

      expect(result.size).toBe(1);
      const city = result.get('1');
      expect(city?.name).toBe('Test City');
      expect(city?.cityHallId).toBe('111');
      expect(city?.planet).toBe('tatooine');
      expect(city?.location).toEqual([100, 200]);
      expect(city?.radius).toBe(500);
      expect(city?.mayorId).toBe('222');
    });

    it('should parse v1 city format correctly', async () => {
      tracker.on.select('CITY_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.Cities,
          value: ':1:Old City:111:naboo:150:250:600:333:8:12:4:60:70:80:150:0:90:100:110:0:0:0:444:555',
        },
      ]);

      const result = await service.getAllCities();

      expect(result.size).toBe(1);
      const city = result.get('1');
      expect(city?.name).toBe('Old City');
      expect(city?.creationTime).toBeNull();
    });
  });

  describe('getCity', () => {
    it('should return city by id', async () => {
      tracker.on.select('CITY_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.Cities,
          value: 'v2:1:Test City:111:tatooine:100:200:500:1000000:222:5:10:3:50:60:70:100:1:80:90:100:0:0:0:333:444',
        },
      ]);

      const result = await service.getCity('1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test City');
    });

    it('should return null for non-existent city', async () => {
      tracker.on.select('CITY_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([]);

      const result = await service.getCity('999');

      expect(result).toBeNull();
    });
  });

  describe('getCityForPlayer', () => {
    it('should return city for a citizen', async () => {
      tracker.on.select('CITY_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.Cities,
          value: 'v2:1:Test City:111:tatooine:100:200:500:1000000:222:5:10:3:50:60:70:100:1:80:90:100:0:0:0:333:444',
        },
        {
          listId: PropertyListIds.Citizens,
          value: 'v2:1:555:PlayerName:combat_brawler:50:Mayor:0:15:Rank1',
        },
      ]);

      const result = await service.getCityForPlayer('555');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test City');
    });

    it('should return null for non-citizen', async () => {
      tracker.on.select('CITY_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.Cities,
          value: 'v2:1:Test City:111:tatooine:100:200:500:1000000:222:5:10:3:50:60:70:100:1:80:90:100:0:0:0:333:444',
        },
      ]);

      const result = await service.getCityForPlayer('999');

      expect(result).toBeNull();
    });
  });

  describe('getCityForStructure', () => {
    it('should return city for a structure', async () => {
      tracker.on.select('CITY_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([
        {
          listId: PropertyListIds.Cities,
          value: 'v2:1:Test City:111:tatooine:100:200:500:1000000:222:5:10:3:50:60:70:100:1:80:90:100:0:0:0:333:444',
        },
        {
          listId: PropertyListIds.CityStructures,
          value: '1:666:1:1',
        },
      ]);

      const result = await service.getCityForStructure('666');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test City');
    });

    it('should return null for structure not in any city', async () => {
      tracker.on.select('CITY_OBJECTS').response({ OBJECT_ID: 12345 });
      mockPropertyListService.load.mockResolvedValue([]);

      const result = await service.getCityForStructure('999');

      expect(result).toBeNull();
    });
  });
});
