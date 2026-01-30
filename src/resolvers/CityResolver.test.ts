import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { City, Citizen, CityStructure } from '../types/City';

import { CityResolver, CitizenResolver, CityStructureResolver } from './CityResolver';

describe('CityResolver', () => {
  let resolver: CityResolver;
  let mockObjectService: { getOne: ReturnType<typeof vi.fn> };
  let mockStringService: { load: ReturnType<typeof vi.fn> };

  const createMockCity = (overrides: Partial<City> = {}): City =>
    ({
      id: '1',
      name: 'Test City',
      mayorId: '12345',
      cityHallId: '111',
      cloneId: '222',
      citizens: [],
      structures: [],
      radius: 150,
      ...overrides,
    }) as City;

  beforeEach(() => {
    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    resolver = new CityResolver(
      mockObjectService as unknown as ServerObjectService,
      mockStringService as unknown as StringFileLoader
    );
  });

  describe('mayor', () => {
    it('should fetch mayor object by mayorId', async () => {
      const mockMayor = { id: '12345', name: 'MayorPlayer' };
      mockObjectService.getOne.mockResolvedValue(mockMayor);

      const result = await resolver.mayor(createMockCity({ mayorId: '12345' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockMayor);
    });
  });

  describe('cityHall', () => {
    it('should fetch city hall object by cityHallId', async () => {
      const mockCityHall = { id: '111', name: 'City Hall' };
      mockObjectService.getOne.mockResolvedValue(mockCityHall);

      const result = await resolver.cityHall(createMockCity({ cityHallId: '111' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('111');
      expect(result).toEqual(mockCityHall);
    });
  });

  describe('cloner', () => {
    it('should fetch cloner object by cloneId', async () => {
      const mockCloner = { id: '222', name: 'Cloning Facility' };
      mockObjectService.getOne.mockResolvedValue(mockCloner);

      const result = await resolver.cloner(createMockCity({ cloneId: '222' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('222');
      expect(result).toEqual(mockCloner);
    });
  });

  describe('citizenCount', () => {
    it('should return the number of citizens', () => {
      const city = createMockCity({
        citizens: [{ id: '1' }, { id: '2' }, { id: '3' }] as Citizen[],
      });

      const result = resolver.citizenCount(city);

      expect(result).toBe(3);
    });
  });

  describe('structureCount', () => {
    it('should return the number of structures', () => {
      const city = createMockCity({
        structures: [{ id: '1' }, { id: '2' }] as CityStructure[],
      });

      const result = resolver.structureCount(city);

      expect(result).toBe(2);
    });
  });

  describe('rank', () => {
    it('should return rank0 for radius less than 150', async () => {
      mockStringService.load.mockResolvedValue({ rank0: 'Outpost' });

      const result = await resolver.rank(createMockCity({ radius: 100 }));

      expect(mockStringService.load).toHaveBeenCalledWith('city/city');
      expect(result).toBe('Outpost');
    });

    it('should return rank1 for radius 150-199', async () => {
      mockStringService.load.mockResolvedValue({ rank1: 'Village' });

      const result = await resolver.rank(createMockCity({ radius: 150 }));

      expect(result).toBe('Village');
    });

    it('should return rank5 for radius 450+', async () => {
      mockStringService.load.mockResolvedValue({ rank5: 'Metropolis' });

      const result = await resolver.rank(createMockCity({ radius: 500 }));

      expect(result).toBe('Metropolis');
    });
  });

  describe('structureSummary', () => {
    it('should calculate structure summary correctly', () => {
      const city = createMockCity({
        structures: [
          { id: '1', type: 1 << 7 }, // Decoration
          { id: '2', type: 1 << 7 }, // Decoration
          { id: '3', type: 1 << 5 }, // MissionTerminal
          { id: '4', type: 1 << 6 }, // SkillTrainer
          { id: '5', type: 1 << 4 }, // CostCityLow
        ] as CityStructure[],
      });

      const result = resolver.structureSummary(city);

      expect(result.decoCount).toBe(2);
      expect(result.terminalCount).toBe(1);
      expect(result.skillTrainerCount).toBe(1);
      expect(result.lowCostCount).toBe(1);
      expect(result.mediumCostCount).toBe(0);
      expect(result.highCostCount).toBe(0);
    });
  });
});

describe('CitizenResolver', () => {
  let resolver: CitizenResolver;
  let mockObjectService: { getOne: ReturnType<typeof vi.fn> };
  let mockStringService: { load: ReturnType<typeof vi.fn> };

  const createMockCitizen = (overrides: Partial<Citizen> = {}): Citizen =>
    ({
      id: '12345',
      name: 'TestCitizen',
      skillTemplate: 'combat_brawler',
      ...overrides,
    }) as Citizen;

  beforeEach(() => {
    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    resolver = new CitizenResolver(
      mockObjectService as unknown as ServerObjectService,
      mockStringService as unknown as StringFileLoader
    );
  });

  describe('object', () => {
    it('should fetch citizen object by id', async () => {
      const mockObject = { id: '12345', name: 'TestPlayer' };
      mockObjectService.getOne.mockResolvedValue(mockObject);

      const result = await resolver.object(createMockCitizen({ id: '12345' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockObject);
    });
  });

  describe('skillTemplateTitle', () => {
    it('should return resolved skill title', async () => {
      // eslint-disable-next-line camelcase
      mockStringService.load.mockResolvedValue({ combat_brawler: 'Brawler' });

      const result = await resolver.skillTemplateTitle(createMockCitizen({ skillTemplate: 'combat_brawler' }));

      expect(mockStringService.load).toHaveBeenCalledWith('ui_roadmap');
      expect(result).toBe('Brawler');
    });
  });
});

describe('CityStructureResolver', () => {
  let resolver: CityStructureResolver;
  let mockObjectService: { getOne: ReturnType<typeof vi.fn> };

  const createMockStructure = (overrides: Partial<CityStructure> = {}): CityStructure =>
    ({
      id: '12345',
      type: 0,
      ...overrides,
    }) as CityStructure;

  beforeEach(() => {
    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    resolver = new CityStructureResolver(mockObjectService as unknown as ServerObjectService);
  });

  describe('object', () => {
    it('should fetch structure object by id', async () => {
      const mockObject = { id: '12345', name: 'TestBuilding' };
      mockObjectService.getOne.mockResolvedValue(mockObject);

      const result = await resolver.object(createMockStructure({ id: '12345' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockObject);
    });
  });

  describe('typeBitNames', () => {
    it('should return array of type bit names', () => {
      // Type with Decoration and MissionTerminal bits set
      const structure = createMockStructure({ type: (1 << 7) | (1 << 5) });

      const result = resolver.typeBitNames(structure);

      expect(result).toContain('Decoration');
      expect(result).toContain('MissionTerminal');
    });

    it('should return empty array when no bits set', () => {
      const structure = createMockStructure({ type: 0 });

      const result = resolver.typeBitNames(structure);

      expect(result).toEqual([]);
    });
  });
});
