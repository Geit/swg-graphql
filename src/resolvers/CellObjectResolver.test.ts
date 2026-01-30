import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CellObjectService } from '../services/CellObjectService';
import { IServerObject } from '../types';

import { CellObjectResolver } from './CellObjectResolver';

describe('CellObjectResolver', () => {
  let resolver: CellObjectResolver;
  let mockCellObjectService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockCellObjectService = {
      load: vi.fn().mockResolvedValue(null),
    };

    resolver = new CellObjectResolver(mockCellObjectService as unknown as CellObjectService);
  });

  describe('cellNumber', () => {
    it('should return cell number from loaded object', async () => {
      mockCellObjectService.load.mockResolvedValue({ CELL_NUMBER: 5 });

      const result = await resolver.cellNumber(createMockObject('12345'));

      expect(mockCellObjectService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(5);
    });

    it('should return null when object not found', async () => {
      mockCellObjectService.load.mockResolvedValue(null);

      const result = await resolver.cellNumber(createMockObject('99999'));

      expect(result).toBeNull();
    });
  });

  describe('isPublic', () => {
    it('should return true when IS_PUBLIC is Y', async () => {
      mockCellObjectService.load.mockResolvedValue({ IS_PUBLIC: 'Y' });

      const result = await resolver.isPublic(createMockObject('12345'));

      expect(result).toBe(true);
    });

    it('should return false when IS_PUBLIC is N', async () => {
      mockCellObjectService.load.mockResolvedValue({ IS_PUBLIC: 'N' });

      const result = await resolver.isPublic(createMockObject('12345'));

      expect(result).toBe(false);
    });

    it('should return false when object not found', async () => {
      mockCellObjectService.load.mockResolvedValue(null);

      const result = await resolver.isPublic(createMockObject('99999'));

      expect(result).toBe(false);
    });
  });

  describe('resolvedName', () => {
    it('should return formatted cell name with number', async () => {
      mockCellObjectService.load.mockResolvedValue({ CELL_NUMBER: 3 });

      const result = await resolver.resolvedName(createMockObject('12345'), false);

      expect(result).toBe('Cell #3');
    });

    it('should return generic name when no cell number', async () => {
      mockCellObjectService.load.mockResolvedValue({ CELL_NUMBER: null });

      const result = await resolver.resolvedName(createMockObject('12345'), false);

      expect(result).toBe('Cell Object');
    });

    it('should return generic name when object not found', async () => {
      mockCellObjectService.load.mockResolvedValue(null);

      const result = await resolver.resolvedName(createMockObject('99999'), false);

      expect(result).toBe('Cell Object');
    });
  });
});
