import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ServerObjectService } from '../services/ServerObjectService';
import { ShipPartStatService } from '../services/ShipPartStatService';
import { TangibleObjectService } from '../services/TangibleObjectService';
import { IServerObject } from '../types';

import { TangibleObjectResolver } from './TangibleObjectResolver';

describe('TangibleObjectResolver', () => {
  let resolver: TangibleObjectResolver;
  let mockTangibleObjectService: { load: ReturnType<typeof vi.fn> };
  let mockObjectService: { getOne: ReturnType<typeof vi.fn> };
  let mockShipPartStatService: { lookupShipPartStats: ReturnType<typeof vi.fn> };

  const createMockObject = (overrides: Partial<IServerObject> = {}): IServerObject =>
    ({
      id: '12345',
      templateId: null,
      ...overrides,
    }) as IServerObject;

  beforeEach(() => {
    mockTangibleObjectService = {
      load: vi.fn().mockResolvedValue(null),
    };

    mockObjectService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockShipPartStatService = {
      lookupShipPartStats: vi.fn().mockResolvedValue(null),
    };

    resolver = new TangibleObjectResolver(
      mockTangibleObjectService as unknown as TangibleObjectService,
      mockObjectService as unknown as ServerObjectService,
      mockShipPartStatService as unknown as ShipPartStatService
    );
  });

  describe('ownerId', () => {
    it('should return owner ID from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ OWNER_ID: '54321' });

      const result = await resolver.ownerId(createMockObject());

      expect(mockTangibleObjectService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe('54321');
    });

    it('should return null when object not found', async () => {
      mockTangibleObjectService.load.mockResolvedValue(null);

      const result = await resolver.ownerId(createMockObject());

      expect(result).toBeNull();
    });
  });

  describe('visible', () => {
    it('should return true when VISIBLE is Y', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ VISIBLE: 'Y' });

      const result = await resolver.visible(createMockObject());

      expect(result).toBe(true);
    });

    it('should return false when VISIBLE is not Y', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ VISIBLE: 'N' });

      const result = await resolver.visible(createMockObject());

      expect(result).toBe(false);
    });
  });

  describe('appearanceData', () => {
    it('should return appearance data from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ APPEARANCE_DATA: 'appearance_string' });

      const result = await resolver.appearanceData(createMockObject());

      expect(result).toBe('appearance_string');
    });
  });

  describe('interestRadius', () => {
    it('should return interest radius from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ INTEREST_RADIUS: 100.5 });

      const result = await resolver.interestRadius(createMockObject());

      expect(result).toBe(100.5);
    });
  });

  describe('pvpType', () => {
    it('should return PVP type from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ PVP_TYPE: 1 });

      const result = await resolver.pvpType(createMockObject());

      expect(result).toBe(1);
    });
  });

  describe('pvpFaction', () => {
    it('should return PVP faction from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ PVP_FACTION: 370444368 });

      const result = await resolver.pvpFaction(createMockObject());

      expect(result).toBe(370444368);
    });
  });

  describe('pvpFactionName', () => {
    it('should return null for unknown faction CRC', async () => {
      // The actual CRC values for 'imperial' and 'rebel' are computed dynamically by getStringCrc
      // We test with an unknown CRC value which should return null
      mockTangibleObjectService.load.mockResolvedValue({ PVP_FACTION: 999 });

      const result = await resolver.pvpFactionName(createMockObject());

      expect(result).toBeNull();
    });

    it('should return null when pvpFaction is null', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ PVP_FACTION: null });

      const result = await resolver.pvpFactionName(createMockObject());

      expect(result).toBeNull();
    });
  });

  describe('damageTaken', () => {
    it('should return damage taken from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ DAMAGE_TAKEN: 500 });

      const result = await resolver.damageTaken(createMockObject());

      expect(result).toBe(500);
    });
  });

  describe('customAppearance', () => {
    it('should return custom appearance from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ CUSTOM_APPEARANCE: 'custom_data' });

      const result = await resolver.customAppearance(createMockObject());

      expect(result).toBe('custom_data');
    });
  });

  describe('count', () => {
    it('should return count from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ COUNT: 10 });

      const result = await resolver.count(createMockObject());

      expect(result).toBe(10);
    });
  });

  describe('condition', () => {
    it('should return condition from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ CONDITION: 100 });

      const result = await resolver.condition(createMockObject());

      expect(result).toBe(100);
    });
  });

  describe('creatorId', () => {
    it('should return creator ID from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ CREATOR_ID: '67890' });

      const result = await resolver.creatorId(createMockObject());

      expect(result).toBe('67890');
    });
  });

  describe('sourceDraftSchematicId', () => {
    it('should return source draft schematic from loaded object', async () => {
      mockTangibleObjectService.load.mockResolvedValue({ SOURCE_DRAFT_SCHEMATIC: 123456 });

      const result = await resolver.sourceDraftSchematicId(createMockObject());

      expect(result).toBe(123456);
    });
  });

  describe('owner', () => {
    it('should fetch owner object', async () => {
      const mockOwner = { id: '54321', name: 'Owner' };
      mockTangibleObjectService.load.mockResolvedValue({ OWNER_ID: '54321' });
      mockObjectService.getOne.mockResolvedValue(mockOwner);

      const result = await resolver.owner(createMockObject());

      expect(mockObjectService.getOne).toHaveBeenCalledWith('54321');
      expect(result).toEqual(mockOwner);
    });

    it('should return null when tangible not found', async () => {
      mockTangibleObjectService.load.mockResolvedValue(null);

      const result = await resolver.owner(createMockObject());

      expect(result).toBeNull();
    });
  });

  describe('creator', () => {
    it('should fetch creator object', async () => {
      const mockCreator = { id: '67890', name: 'Creator' };
      mockTangibleObjectService.load.mockResolvedValue({ CREATOR_ID: '67890' });
      mockObjectService.getOne.mockResolvedValue(mockCreator);

      const result = await resolver.creator(createMockObject());

      expect(mockObjectService.getOne).toHaveBeenCalledWith('67890');
      expect(result).toEqual(mockCreator);
    });

    it('should return null when tangible not found', async () => {
      mockTangibleObjectService.load.mockResolvedValue(null);

      const result = await resolver.creator(createMockObject());

      expect(result).toBeNull();
    });
  });

  describe('shipPartSummary', () => {
    it('should lookup ship part stats when templateId exists', async () => {
      const mockStats = { isReverseEngineered: true, stats: [] };
      mockShipPartStatService.lookupShipPartStats.mockResolvedValue(mockStats);

      const result = await resolver.shipPartSummary(createMockObject({ templateId: 12345 }));

      expect(mockShipPartStatService.lookupShipPartStats).toHaveBeenCalledWith('12345', 12345);
      expect(result).toEqual(mockStats);
    });

    it('should return null when no templateId', async () => {
      const result = await resolver.shipPartSummary(createMockObject({ templateId: undefined }));

      expect(mockShipPartStatService.lookupShipPartStats).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
