import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DataTableService } from './DataTableService';

// Mock the DataTableReader module
vi.mock('../utils/DataTableReader', () => ({
  loadDatatable: vi.fn().mockResolvedValue([]),
}));

describe('DataTableService', () => {
  let service: DataTableService;
  let mockLoadDatatable: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();

    const { loadDatatable } = await import('../utils/DataTableReader');
    mockLoadDatatable = loadDatatable as ReturnType<typeof vi.fn>;
    mockLoadDatatable.mockResolvedValue([]);

    service = new DataTableService();
  });

  describe('load', () => {
    it('should call loadDatatable with the provided options', async () => {
      const mockData = [
        { id: 1, name: 'Test1' },
        { id: 2, name: 'Test2' },
      ];
      mockLoadDatatable.mockResolvedValue(mockData);

      const result = await service.load<{ id: number; name: string }>({
        fileName: 'test/data.iff',
      });

      expect(mockLoadDatatable).toHaveBeenCalledWith({ fileName: 'test/data.iff' });
      expect(result).toEqual(mockData);
    });

    it('should pass camelcase option to loadDatatable', async () => {
      mockLoadDatatable.mockResolvedValue([{ testField: 'value' }]);

      await service.load({
        fileName: 'test/data.iff',
        camelcase: true,
      });

      expect(mockLoadDatatable).toHaveBeenCalledWith({
        fileName: 'test/data.iff',
        camelcase: true,
      });
    });

    it('should return typed data', async () => {
      interface TestRow {
        level: number;
        xpRequired: number;
      }

      const mockData: TestRow[] = [
        { level: 1, xpRequired: 0 },
        { level: 2, xpRequired: 1000 },
      ];
      mockLoadDatatable.mockResolvedValue(mockData);

      const result = await service.load<TestRow>({
        fileName: 'player/player_level.iff',
        camelcase: true,
      });

      expect(result).toHaveLength(2);
      expect(result[0].level).toBe(1);
      expect(result[1].xpRequired).toBe(1000);
    });

    it('should return empty array when no data found', async () => {
      mockLoadDatatable.mockResolvedValue([]);

      const result = await service.load({ fileName: 'empty/table.iff' });

      expect(result).toEqual([]);
    });

    it('dedupes repeated loads of the same file passed as distinct option objects', async () => {
      mockLoadDatatable.mockResolvedValue([{ id: 1 }]);

      await service.load({ fileName: 'gcw/x.iff', camelcase: true });
      await service.load({ fileName: 'gcw/x.iff', camelcase: true });

      expect(mockLoadDatatable).toHaveBeenCalledTimes(1);
    });

    it('keys camelcase variants of the same file separately', async () => {
      mockLoadDatatable.mockResolvedValue([]);

      await service.load({ fileName: 'gcw/x.iff', camelcase: true });
      await service.load({ fileName: 'gcw/x.iff', camelcase: false });

      expect(mockLoadDatatable).toHaveBeenCalledTimes(2);
    });

    it('does not cache a failed load, so a later call retries and can succeed', async () => {
      mockLoadDatatable.mockRejectedValueOnce(new Error('missing')).mockResolvedValueOnce([{ id: 1 }]);

      await expect(service.load({ fileName: 'gcw/x.iff' })).rejects.toThrow('missing');
      const result = await service.load({ fileName: 'gcw/x.iff' });

      expect(result).toEqual([{ id: 1 }]);
      expect(mockLoadDatatable).toHaveBeenCalledTimes(2);
    });
  });

  describe('batchFunction', () => {
    it('should batch load multiple datatables', async () => {
      const mockData1 = [{ id: 1 }];
      const mockData2 = [{ id: 2 }];
      mockLoadDatatable.mockResolvedValueOnce(mockData1).mockResolvedValueOnce(mockData2);

      const result = await DataTableService.batchFunction([{ fileName: 'table1.iff' }, { fileName: 'table2.iff' }]);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockData1);
      expect(result[1]).toEqual(mockData2);
    });
  });
});
