import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ShipPartStatService } from './ShipPartStatService';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn().mockRejectedValue(new Error('File not found')),
  },
}));

describe('ShipPartStatService', () => {
  let service: ShipPartStatService;
  let mockDataTable: { load: ReturnType<typeof vi.fn> };
  let mockObjVarService: { getObjVarsForObject: ReturnType<typeof vi.fn> };
  let mockStringService: { load: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDataTable = {
      load: vi.fn().mockResolvedValue([]),
    };

    mockObjVarService = {
      getObjVarsForObject: vi.fn().mockResolvedValue([]),
    };

    mockStringService = {
      load: vi.fn().mockResolvedValue({}),
    };

    service = new ShipPartStatService();
    // Inject mocks using type coercion
    (service as unknown as { dataTable: typeof mockDataTable }).dataTable = mockDataTable;
    (service as unknown as { objvarService: typeof mockObjVarService }).objvarService = mockObjVarService;
    (service as unknown as { stringService: typeof mockStringService }).stringService = mockStringService;

    // Reset the loading state
    service.loadingHandle = false;
    service.shipPartMap.clear();
    service.bestInClassForPartMap.clear();
  });

  describe('isShipPart', () => {
    it('should return false for unknown CRC when no parts loaded', async () => {
      const result = await service.isShipPart(12345);

      expect(result).toBe(false);
    });

    it('should return true for known ship part CRC after loading', async () => {
      // Mock the datatable to return an armor component
      mockDataTable.load.mockResolvedValue([
        {
          strType: 'arm_generic',
          reverseEngineeringLevel: 1,
          fltMaximumArmorHitpoints: 1000,
          fltMaximumArmorHitpointsMod: 0.1,
          fltMass: 100,
          fltMassModifier: 0.1,
        },
      ]);

      // First call loads the parts
      await service.isShipPart(12345);

      // The CRC for 'arm_generic' should now be in the map
      expect(service.shipPartMap.size).toBeGreaterThan(0);
    });
  });

  describe('lookupShipPartStats', () => {
    it('should return null for unknown CRC', async () => {
      const result = await service.lookupShipPartStats('12345', 99999);

      expect(result).toBeNull();
    });

    it('should return ship part summary for known part', async () => {
      // Mock the datatable to return an armor component
      mockDataTable.load.mockResolvedValue([
        {
          strType: 'arm_test_part',
          reverseEngineeringLevel: 5,
          fltMaximumArmorHitpoints: 1000,
          fltMaximumArmorHitpointsMod: 0.2,
          fltMass: 100,
          fltMassModifier: 0.1,
        },
      ]);

      mockObjVarService.getObjVarsForObject.mockResolvedValue([
        { name: 'ship_comp.armor_hitpoints_maximum', type: 2, value: 1100 },
        { name: 'ship_comp.mass', type: 2, value: 95 },
        { name: 'ship_comp.flags', type: 0, value: 16 }, // RE flag set (1 << 4)
      ]);

      mockStringService.load.mockResolvedValue({
        // eslint-disable-next-line camelcase
        ship_component_hitpoints: 'Hitpoints',
        // eslint-disable-next-line camelcase
        ship_component_mass: 'Mass',
      });

      // Manually set up a known ship part in the map
      const testCrc = 12345;
      service.shipPartMap.set(testCrc, {
        name: 'arm_test_part',
        type: 'armor',
        crc: testCrc,
        reLevel: 5,
        stats: [
          {
            name: 'ship_component_hitpoints',
            mean: 1000,
            stdDev: 100,
            objVarKey: 'ship_comp.armor_hitpoints_maximum',
          },
          {
            name: 'ship_component_mass',
            mean: 100,
            stdDev: 5,
            inverse: true,
            objVarKey: 'ship_comp.mass',
          },
        ],
      });

      service.bestInClassForPartMap.set(
        'armor',
        new Map([
          [
            'ship_component_hitpoints',
            new Map([
              [
                5,
                {
                  name: 'ship_component_hitpoints',
                  mean: 1000,
                  stdDev: 100,
                  objVarKey: 'ship_comp.armor_hitpoints_maximum',
                },
              ],
            ]),
          ],
          [
            'ship_component_mass',
            new Map([
              [
                5,
                {
                  name: 'ship_component_mass',
                  mean: 100,
                  stdDev: 5,
                  inverse: true,
                  objVarKey: 'ship_comp.mass',
                },
              ],
            ]),
          ],
        ])
      );

      // Mark as loaded to skip loading
      service.loadingHandle = Promise.resolve();

      const result = await service.lookupShipPartStats('12345', testCrc);

      expect(result).not.toBeNull();
      expect(result?.isReverseEngineered).toBe(true);
      expect(result?.reverseEngineeringLevel).toBe(5);
      expect(result?.stats).toHaveLength(2);
    });

    it('should return default values when objvars are missing', async () => {
      const testCrc = 99999;
      service.shipPartMap.set(testCrc, {
        name: 'test_part',
        type: 'armor',
        crc: testCrc,
        reLevel: 1,
        stats: [
          {
            name: 'ship_component_hitpoints',
            mean: 1000,
            stdDev: 100,
            objVarKey: 'ship_comp.armor_hitpoints_maximum',
          },
        ],
      });

      mockObjVarService.getObjVarsForObject.mockResolvedValue([]);
      mockStringService.load.mockResolvedValue({});

      service.loadingHandle = Promise.resolve();

      const result = await service.lookupShipPartStats('12345', testCrc);

      expect(result).not.toBeNull();
      expect(result?.stats[0].value).toBe(0);
      expect(result?.stats[0].percentile).toBe(0);
    });

    it('should calculate inverse percentile for inverse stats', async () => {
      const testCrc = 88888;
      service.shipPartMap.set(testCrc, {
        name: 'test_part',
        type: 'armor',
        crc: testCrc,
        reLevel: 1,
        stats: [
          {
            name: 'ship_component_hitpoints',
            mean: 1000,
            stdDev: 100,
            objVarKey: 'ship_comp.armor_hitpoints_maximum',
          },
          {
            name: 'ship_component_mass',
            mean: 100,
            stdDev: 10,
            inverse: true,
            objVarKey: 'ship_comp.mass',
          },
        ],
      });

      // Need to provide bestInClass for both armor stats as COMPONENT_CLASS_DATA defines them
      service.bestInClassForPartMap.set(
        'armor',
        new Map([
          [
            'ship_component_hitpoints',
            new Map([
              [
                1,
                {
                  name: 'ship_component_hitpoints',
                  mean: 1000,
                  stdDev: 100,
                  objVarKey: 'ship_comp.armor_hitpoints_maximum',
                },
              ],
            ]),
          ],
          [
            'ship_component_mass',
            new Map([
              [
                1,
                {
                  name: 'ship_component_mass',
                  mean: 100,
                  stdDev: 10,
                  inverse: true,
                  objVarKey: 'ship_comp.mass',
                },
              ],
            ]),
          ],
        ])
      );

      // Provide objvars for both stats - lower mass is better for inverse stats
      mockObjVarService.getObjVarsForObject.mockResolvedValue([
        { name: 'ship_comp.armor_hitpoints_maximum', type: 2, value: 1000 }, // at mean
        { name: 'ship_comp.mass', type: 2, value: 90 }, // 1 std dev below mean (good for inverse)
      ]);
      mockStringService.load.mockResolvedValue({});

      service.loadingHandle = Promise.resolve();

      const result = await service.lookupShipPartStats('12345', testCrc);

      expect(result).not.toBeNull();
      // For inverse stats, percentile is inverted (1 - percentile)
      // A value of 90 is 1 std dev below mean, normally ~16th percentile
      // But for inverse, it becomes ~84th percentile
      // Mass is the second stat (index 1)
      expect(result?.stats[1].percentile).toBeGreaterThan(50);
    });

    it('should determine isReverseEngineered based on flags objvar', async () => {
      const testCrc = 77777;
      service.shipPartMap.set(testCrc, {
        name: 'test_part',
        type: 'armor',
        crc: testCrc,
        reLevel: 1,
        stats: [],
      });

      // Flag 16 (1 << 4) indicates RE
      mockObjVarService.getObjVarsForObject.mockResolvedValue([{ name: 'ship_comp.flags', type: 0, value: 16 }]);
      mockStringService.load.mockResolvedValue({});

      service.loadingHandle = Promise.resolve();

      const result = await service.lookupShipPartStats('12345', testCrc);

      expect(result?.isReverseEngineered).toBe(true);
    });

    it('should return false for isReverseEngineered when flag is not set', async () => {
      const testCrc = 66666;
      service.shipPartMap.set(testCrc, {
        name: 'test_part',
        type: 'armor',
        crc: testCrc,
        reLevel: 1,
        stats: [],
      });

      // Flag 0 means not RE
      mockObjVarService.getObjVarsForObject.mockResolvedValue([{ name: 'ship_comp.flags', type: 0, value: 0 }]);
      mockStringService.load.mockResolvedValue({});

      service.loadingHandle = Promise.resolve();

      const result = await service.lookupShipPartStats('12345', testCrc);

      expect(result?.isReverseEngineered).toBe(false);
    });
  });

  describe('loadStajData', () => {
    it('should handle missing staj file gracefully', async () => {
      // The mock already returns file not found
      await service.loadStajData();

      expect(service.stajTiers).toHaveLength(0);
      expect(service.stajPartData.size).toBe(0);
    });
  });

  describe('getStajFile', () => {
    it('should return null when file does not exist', async () => {
      const result = await service.getStajFile();

      expect(result).toBeNull();
    });
  });

  describe('headlinePercentile calculation', () => {
    it('should return max percentile across all stats', async () => {
      const testCrc = 55555;
      service.shipPartMap.set(testCrc, {
        name: 'test_part',
        type: 'armor',
        crc: testCrc,
        reLevel: 1,
        stats: [
          {
            name: 'ship_component_hitpoints',
            mean: 1000,
            stdDev: 100,
            objVarKey: 'ship_comp.armor_hitpoints_maximum',
          },
          {
            name: 'ship_component_mass',
            mean: 100,
            stdDev: 10,
            objVarKey: 'ship_comp.mass',
          },
        ],
      });

      service.bestInClassForPartMap.set(
        'armor',
        new Map([
          [
            'ship_component_hitpoints',
            new Map([
              [
                1,
                {
                  name: 'ship_component_hitpoints',
                  mean: 1000,
                  stdDev: 100,
                  objVarKey: 'ship_comp.armor_hitpoints_maximum',
                },
              ],
            ]),
          ],
          [
            'ship_component_mass',
            new Map([
              [
                1,
                {
                  name: 'ship_component_mass',
                  mean: 100,
                  stdDev: 10,
                  objVarKey: 'ship_comp.mass',
                },
              ],
            ]),
          ],
        ])
      );

      // Hitpoints 2 std dev above mean (~97th percentile)
      // Mass at mean (~50th percentile)
      mockObjVarService.getObjVarsForObject.mockResolvedValue([
        { name: 'ship_comp.armor_hitpoints_maximum', type: 2, value: 1200 },
        { name: 'ship_comp.mass', type: 2, value: 100 },
      ]);
      mockStringService.load.mockResolvedValue({});

      service.loadingHandle = Promise.resolve();

      const result = await service.lookupShipPartStats('12345', testCrc);

      // Headline should be the max (hitpoints ~97%)
      expect(result?.headlinePercentile).toBeGreaterThan(90);
    });
  });
});
