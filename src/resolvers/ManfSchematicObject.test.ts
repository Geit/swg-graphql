import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ManfSchematicObjectService } from '../services/ManfSchematicObjectService';
import { IServerObject } from '../types';

import { ManfSchematicObjectResolver } from './ManfSchematicObject';

describe('ManfSchematicObjectResolver', () => {
  let resolver: ManfSchematicObjectResolver;
  let mockService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockService = {
      load: vi.fn().mockResolvedValue(null),
    };

    resolver = new ManfSchematicObjectResolver(mockService as unknown as ManfSchematicObjectService);
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
});
