import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ManfSchematicAttributeService } from '../services/ManfSchematicAttributeService';
import { ManfSchematicObjectService } from '../services/ManfSchematicObjectService';
import { IServerObject } from '../types';

import { ManfSchematicObjectResolver } from './ManfSchematicObject';

describe('ManfSchematicObjectResolver', () => {
  let resolver: ManfSchematicObjectResolver;
  let mockService: { load: ReturnType<typeof vi.fn> };
  let mockAttributeService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockService = {
      load: vi.fn().mockResolvedValue(null),
    };
    mockAttributeService = {
      load: vi.fn().mockResolvedValue([]),
    };

    resolver = new ManfSchematicObjectResolver(
      mockService as unknown as ManfSchematicObjectService,
      mockAttributeService as unknown as ManfSchematicAttributeService
    );
  });

  describe('creatorName', () => {
    it('should return creator name from loaded object', async () => {
      mockService.load.mockResolvedValue({ CREATOR_NAME: 'TestCrafter' });

      const result = await resolver.creatorName(createMockObject('12345'));

      expect(mockService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe('TestCrafter');
    });

    it('should return undefined when object not found', async () => {
      mockService.load.mockResolvedValue(null);

      const result = await resolver.creatorName(createMockObject('99999'));

      expect(result).toBeUndefined();
    });
  });

  describe('itemsPerContainer', () => {
    it('should return items per container from loaded object', async () => {
      mockService.load.mockResolvedValue({ ITEMS_PER_CONTAINER: 25 });

      const result = await resolver.itemsPerContainer(createMockObject('12345'));

      expect(result).toBe(25);
    });
  });

  describe('manufactureTime', () => {
    it('should return manufacture time from loaded object', async () => {
      mockService.load.mockResolvedValue({ MANUFACTURE_TIME: 30 });

      const result = await resolver.manufactureTime(createMockObject('12345'));

      expect(result).toBe(30);
    });
  });

  describe('draftSchematic', () => {
    it('should return draft schematic from loaded object', async () => {
      mockService.load.mockResolvedValue({ DRAFT_SCHEMATIC: 'some_schematic_crc' });

      const result = await resolver.draftSchematic(createMockObject('12345'));

      expect(result).toBe('some_schematic_crc');
    });
  });

  describe('attributes', () => {
    it('should map attribute records to name/value pairs', async () => {
      mockAttributeService.load.mockResolvedValue([
        { OBJECT_ID: 12345, ATTRIBUTE_TYPE: 'crafting:damage', VALUE: 100 },
        { OBJECT_ID: 12345, ATTRIBUTE_TYPE: 'crafting:accuracy', VALUE: 50 },
      ]);

      const result = await resolver.attributes(createMockObject('12345'));

      expect(mockAttributeService.load).toHaveBeenCalledWith('12345');
      expect(result).toEqual([
        { name: 'crafting:damage', value: 100 },
        { name: 'crafting:accuracy', value: 50 },
      ]);
    });

    it('should return an empty array when there are no attribute rows', async () => {
      mockAttributeService.load.mockResolvedValue([]);

      const result = await resolver.attributes(createMockObject('99999'));

      expect(result).toEqual([]);
    });

    it('should preserve null values from the database', async () => {
      mockAttributeService.load.mockResolvedValue([
        { OBJECT_ID: 12345, ATTRIBUTE_TYPE: 'crafting:missing', VALUE: null },
      ]);

      const result = await resolver.attributes(createMockObject('12345'));

      expect(result).toEqual([{ name: 'crafting:missing', value: null }]);
    });
  });
});
