import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UnenrichedServerObject } from '../types/ServerObject';

import { NameResolutionService } from './NameResolutionService';
import { StringFileLoader } from './StringFileLoader';

interface TestObject {
  name: string | null;
  staticItemName: string | null;
  nameStringTable: string | null;
  nameStringText: string | null;
}

describe('NameResolutionService', () => {
  let service: NameResolutionService;
  let mockStringFileService: { load: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.resetAllMocks();

    mockStringFileService = {
      load: vi.fn().mockResolvedValue({}),
    };

    service = new NameResolutionService(mockStringFileService as unknown as StringFileLoader);
  });

  describe('resolveName', () => {
    it('should return trimmed custom name when available and resolveCustomNames is true', async () => {
      const object: TestObject = {
        name: '  Custom Name  ',
        staticItemName: null,
        nameStringTable: null,
        nameStringText: null,
      };

      const result = await service.resolveName(object as UnenrichedServerObject);

      expect(result).toBe('Custom Name');
    });

    it('should skip custom name when resolveCustomNames is false', async () => {
      const object: TestObject = {
        name: 'Custom Name',
        staticItemName: 'staticItemId',
        nameStringTable: null,
        nameStringText: null,
      };
      mockStringFileService.load.mockResolvedValue({
        staticItemId: 'Static Item Name',
      });

      const result = await service.resolveName(object as UnenrichedServerObject, false);

      expect(result).toBe('Static Item Name');
      expect(mockStringFileService.load).toHaveBeenCalledWith('static_item_n');
    });

    it('should resolve name from static item when no custom name', async () => {
      const object: TestObject = {
        name: null,
        staticItemName: 'myStaticItem',
        nameStringTable: null,
        nameStringText: null,
      };
      mockStringFileService.load.mockResolvedValue({
        myStaticItem: 'My Static Item',
      });

      const result = await service.resolveName(object as UnenrichedServerObject);

      expect(result).toBe('My Static Item');
      expect(mockStringFileService.load).toHaveBeenCalledWith('static_item_n');
    });

    it('should return fallback string when static item not found in string file', async () => {
      const object: TestObject = {
        name: null,
        staticItemName: 'unknown_item',
        nameStringTable: null,
        nameStringText: null,
      };
      mockStringFileService.load.mockResolvedValue({});

      const result = await service.resolveName(object as UnenrichedServerObject);

      expect(result).toBe('@static_item_n:unknown_item');
    });

    it('should resolve name from string table when no custom name or static item', async () => {
      const object: TestObject = {
        name: null,
        staticItemName: null,
        nameStringTable: 'obj_n',
        nameStringText: 'weaponRifle',
      };
      mockStringFileService.load.mockResolvedValue({
        weaponRifle: 'Blaster Rifle',
      });

      const result = await service.resolveName(object as UnenrichedServerObject);

      expect(result).toBe('Blaster Rifle');
      expect(mockStringFileService.load).toHaveBeenCalledWith('obj_n');
    });

    it('should return fallback string when string table entry not found', async () => {
      const object: TestObject = {
        name: null,
        staticItemName: null,
        nameStringTable: 'obj_n',
        nameStringText: 'unknown_object',
      };
      mockStringFileService.load.mockResolvedValue({});

      const result = await service.resolveName(object as UnenrichedServerObject);

      expect(result).toBe('@obj_n:unknown_object');
    });

    it('should return nameStringText when no other source available', async () => {
      const object: TestObject = {
        name: null,
        staticItemName: null,
        nameStringTable: null,
        nameStringText: 'fallback_text',
      };

      const result = await service.resolveName(object as UnenrichedServerObject);

      expect(result).toBe('fallback_text');
    });

    it('should return UNKNOWN when no name sources available', async () => {
      const object: TestObject = {
        name: null,
        staticItemName: null,
        nameStringTable: null,
        nameStringText: null,
      };

      const result = await service.resolveName(object as UnenrichedServerObject);

      expect(result).toBe('UNKNOWN');
    });

    it('should treat empty string name as no custom name', async () => {
      const object: TestObject = {
        name: '   ',
        staticItemName: 'staticItem',
        nameStringTable: null,
        nameStringText: null,
      };
      mockStringFileService.load.mockResolvedValue({
        staticItem: 'Static Name',
      });

      const result = await service.resolveName(object as UnenrichedServerObject);

      expect(result).toBe('Static Name');
    });
  });
});
