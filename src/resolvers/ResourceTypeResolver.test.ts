import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ClusterClockService } from '../services/ClusterClockService';
import { DataTableService } from '../services/DataTableService';
import { PlanetObjectService } from '../services/PlanetObjectService';
import { ResourceContainerObjectService } from '../services/ResourceContainerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { ResourceType, ResourceTypeAttribute, ResourceTypePlanetDistribution } from '../types/ResourceType';

import {
  ResourceTypeResolver,
  ResourceTypeAttributeResolver,
  ResourceTypePlanetDistributionResolver,
} from './ResourceTypeResolver';

describe('ResourceTypeResolver', () => {
  let resolver: ResourceTypeResolver;
  let mockStringService: { load: ReturnType<typeof vi.fn> };
  let mockClusterClock: { getRealTime: ReturnType<typeof vi.fn> };
  let mockDataTable: { load: ReturnType<typeof vi.fn> };
  let mockRcObjectService: { getCirculationAmountForResourceTypeId: ReturnType<typeof vi.fn> };

  const createMockResource = (overrides: Partial<ResourceType> = {}): ResourceType =>
    ({
      id: '12345',
      name: null,
      classId: null,
      depletedTime: null,
      ...overrides,
    }) as ResourceType;

  beforeEach(() => {
    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    mockClusterClock = {
      getRealTime: vi.fn().mockResolvedValue(null),
    };

    mockDataTable = {
      load: vi.fn().mockResolvedValue([]),
    };

    mockRcObjectService = {
      getCirculationAmountForResourceTypeId: vi.fn().mockResolvedValue({ totalQuantity: 0, containerObjects: 0 }),
    };

    resolver = new ResourceTypeResolver(
      mockStringService as unknown as StringFileLoader,
      mockClusterClock as unknown as ClusterClockService,
      mockDataTable as unknown as DataTableService,
      mockRcObjectService as unknown as ResourceContainerObjectService
    );
  });

  describe('name', () => {
    it('should return name directly when not a string reference', async () => {
      const result = await resolver.name(createMockResource({ name: 'Iron' }));

      expect(result).toBe('Iron');
    });

    it('should resolve string reference when name starts with @', async () => {
      mockStringService.load.mockResolvedValue({
        // eslint-disable-next-line camelcase
        iron_name: 'Lokian Iron',
      });

      const result = await resolver.name(createMockResource({ name: '@resource/resource_names:iron_name' }));

      expect(mockStringService.load).toHaveBeenCalledWith('resource/resource_names');
      expect(result).toBe('Lokian Iron');
    });

    it('should return null when string not found', async () => {
      mockStringService.load.mockResolvedValue({});

      const result = await resolver.name(createMockResource({ name: '@missing:key' }));

      expect(result).toBeNull();
    });
  });

  describe('className', () => {
    it('should return resolved class name', async () => {
      mockStringService.load.mockResolvedValue({
        // eslint-disable-next-line camelcase
        iron_lokian: 'Lokian Iron',
      });

      const result = await resolver.className(createMockResource({ classId: 'iron_lokian' }));

      expect(mockStringService.load).toHaveBeenCalledWith('resource/resource_names');
      expect(result).toBe('Lokian Iron');
    });

    it('should return null when no classId', async () => {
      const result = await resolver.className(createMockResource({ classId: null }));

      expect(result).toBeNull();
    });
  });

  describe('depletedTimeReal', () => {
    it('should return ISO string of real time', async () => {
      const realTime = new Date('2024-06-15T12:00:00Z');
      mockClusterClock.getRealTime.mockResolvedValue(realTime);

      const result = await resolver.depletedTimeReal(createMockResource({ depletedTime: 1000000 }));

      expect(mockClusterClock.getRealTime).toHaveBeenCalledWith(1000000);
      expect(result).toBe('2024-06-15T12:00:00.000Z');
    });

    it('should return null when no depleted time', async () => {
      const result = await resolver.depletedTimeReal(createMockResource({ depletedTime: null }));

      expect(result).toBeNull();
    });
  });

  describe('fractalData', () => {
    it('should return fractal data when found', async () => {
      mockDataTable.load.mockResolvedValueOnce([{ index: 1, enum: 'iron_lokian' }]);
      mockDataTable.load.mockResolvedValueOnce([
        {
          resourceIndex: 1,
          poolSizeMin: 100,
          poolSizeMax: 1000,
          fractalType: 'A',
          fractalXScale: 1.0,
          fractalYScale: 1.0,
          fractalBias: 0.5,
          fractalGain: 0.5,
          fractalComboRule: 0,
          fractalFrequency: 10,
          fractalAmplitude: 5,
          fractalOctaves: 4,
        },
      ]);

      const result = await resolver.fractalData(createMockResource({ classId: 'iron_lokian' }));

      expect(result).toEqual({
        poolSizeMin: 100,
        poolSizeMax: 1000,
        type: 'A',
        xScale: 1.0,
        yScale: 1.0,
        bias: 0.5,
        gain: 0.5,
        comboRule: 0,
        frequency: 10,
        amplitude: 5,
        octaves: 4,
      });
    });

    it('should return null when resource not found in tree', async () => {
      mockDataTable.load.mockResolvedValueOnce([]);

      const result = await resolver.fractalData(createMockResource({ classId: 'unknown' }));

      expect(result).toBeNull();
    });
  });

  describe('circulationData', () => {
    it('should return circulation data for resource type', async () => {
      mockRcObjectService.getCirculationAmountForResourceTypeId.mockResolvedValue({
        totalQuantity: 50000,
        containerObjects: 25,
      });

      const result = await resolver.circulationData(createMockResource({ id: '12345' }));

      expect(mockRcObjectService.getCirculationAmountForResourceTypeId).toHaveBeenCalledWith(12345);
      expect(result).toEqual({ totalQuantity: 50000, containerObjects: 25 });
    });
  });
});

describe('ResourceTypeAttributeResolver', () => {
  let resolver: ResourceTypeAttributeResolver;
  let mockStringService: { load: ReturnType<typeof vi.fn> };

  const createMockAttribute = (attributeId: string | null): ResourceTypeAttribute =>
    ({
      attributeId,
    }) as ResourceTypeAttribute;

  beforeEach(() => {
    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    resolver = new ResourceTypeAttributeResolver(mockStringService as unknown as StringFileLoader);
  });

  describe('attributeName', () => {
    it('should return resolved attribute name', async () => {
      mockStringService.load.mockResolvedValue({
        // eslint-disable-next-line camelcase
        res_cold_resist: 'Cold Resistance',
      });

      const result = await resolver.attributeName(createMockAttribute('res_cold_resist'));

      expect(mockStringService.load).toHaveBeenCalledWith('obj_attr_n');
      expect(result).toBe('Cold Resistance');
    });

    it('should return null when no attributeId', async () => {
      const result = await resolver.attributeName(createMockAttribute(null));

      expect(result).toBeNull();
    });
  });
});

describe('ResourceTypePlanetDistributionResolver', () => {
  let resolver: ResourceTypePlanetDistributionResolver;
  let mockStringService: { load: ReturnType<typeof vi.fn> };
  let mockPlanetObjectService: { load: ReturnType<typeof vi.fn> };

  const createMockDistribution = (planetId: string | null): ResourceTypePlanetDistribution =>
    ({
      planetId,
    }) as ResourceTypePlanetDistribution;

  beforeEach(() => {
    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    mockPlanetObjectService = {
      load: vi.fn().mockResolvedValue(null),
    };

    resolver = new ResourceTypePlanetDistributionResolver(
      mockStringService as unknown as StringFileLoader,
      mockPlanetObjectService as unknown as PlanetObjectService
    );
  });

  describe('sceneId', () => {
    it('should return planet name from planet object', async () => {
      mockPlanetObjectService.load.mockResolvedValue({ PLANET_NAME: 'tatooine' });

      const result = await resolver.sceneId(createMockDistribution('42'));

      expect(mockPlanetObjectService.load).toHaveBeenCalledWith('42');
      expect(result).toBe('tatooine');
    });

    it('should return null when no planetId', async () => {
      const result = await resolver.sceneId(createMockDistribution(null));

      expect(result).toBeNull();
    });
  });

  describe('sceneName', () => {
    it('should return resolved planet name', async () => {
      mockPlanetObjectService.load.mockResolvedValue({ PLANET_NAME: 'tatooine' });
      mockStringService.load.mockResolvedValue({
        tatooine: 'Tatooine',
      });

      const result = await resolver.sceneName(createMockDistribution('42'));

      expect(mockStringService.load).toHaveBeenCalledWith('planet_n');
      expect(result).toBe('Tatooine');
    });

    it('should return null when scene not in string file', async () => {
      mockPlanetObjectService.load.mockResolvedValue({ PLANET_NAME: 'unknown' });
      mockStringService.load.mockResolvedValue({});

      const result = await resolver.sceneName(createMockDistribution('42'));

      expect(result).toBeNull();
    });
  });
});
