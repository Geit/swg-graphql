import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StringFileLoader, parseStringRef } from './StringFileLoader';

// Mock the StringFileReader module
vi.mock('../utils/StringFileReader', () => ({
  loadStringFile: vi.fn().mockResolvedValue({}),
}));

describe('parseStringRef', () => {
  it('should parse a reference with @ prefix', () => {
    const result = parseStringRef('@obj_attr_n:efficiency');

    expect(result).toEqual({
      fileName: 'obj_attr_n',
      key: 'efficiency',
    });
  });

  it('should parse a reference without @ prefix', () => {
    const result = parseStringRef('obj_attr_n:efficiency');

    expect(result).toEqual({
      fileName: 'obj_attr_n',
      key: 'efficiency',
    });
  });

  it('should return null for invalid reference without colon', () => {
    const result = parseStringRef('invalid_reference');

    expect(result).toBeNull();
  });

  it('should return null for empty file name', () => {
    const result = parseStringRef(':key');

    expect(result).toBeNull();
  });

  it('should return null for empty key', () => {
    const result = parseStringRef('file:');

    expect(result).toBeNull();
  });

  it('should handle keys with colons', () => {
    const result = parseStringRef('file:key:with:colons');

    expect(result).toEqual({
      fileName: 'file',
      key: 'key:with:colons',
    });
  });
});

describe('StringFileLoader', () => {
  let service: StringFileLoader;
  let mockLoadStringFile: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();

    const { loadStringFile } = await import('../utils/StringFileReader');
    mockLoadStringFile = loadStringFile as ReturnType<typeof vi.fn>;
    mockLoadStringFile.mockResolvedValue({});

    service = new StringFileLoader();
  });

  describe('load', () => {
    it('should load a string file and return its contents', async () => {
      const mockStrings = {
        key1: 'Value 1',
        key2: 'Value 2',
      };
      mockLoadStringFile.mockResolvedValue(mockStrings);

      const result = await service.load('test_strings');

      expect(result).toEqual(mockStrings);
      expect(mockLoadStringFile).toHaveBeenCalledWith('test_strings');
    });
  });

  describe('tryLoadFromRef', () => {
    it('should return the string value for a valid reference', async () => {
      const mockStrings = {
        efficiency: 'Harvesting Efficiency',
      };
      mockLoadStringFile.mockResolvedValue(mockStrings);

      const result = await service.tryLoadFromRef('@obj_attr_n:efficiency');

      expect(result).toBe('Harvesting Efficiency');
    });

    it('should return null for an invalid reference format', async () => {
      const result = await service.tryLoadFromRef('invalid_reference');

      expect(result).toBeNull();
    });

    it('should return null when key is not found in string file', async () => {
      mockLoadStringFile.mockResolvedValue({
        otherKey: 'Other Value',
      });

      const result = await service.tryLoadFromRef('@obj_attr_n:missing_key');

      expect(result).toBeNull();
    });

    it('should perform case-insensitive lookup when exact match not found', async () => {
      mockLoadStringFile.mockResolvedValue({
        EFFICIENCY: 'Harvesting Efficiency',
      });

      const result = await service.tryLoadFromRef('@obj_attr_n:efficiency');

      expect(result).toBe('Harvesting Efficiency');
    });

    it('should prefer exact match over case-insensitive match', async () => {
      mockLoadStringFile.mockResolvedValue({
        efficiency: 'Exact Match',
        EFFICIENCY: 'Case Insensitive Match',
      });

      const result = await service.tryLoadFromRef('@obj_attr_n:efficiency');

      expect(result).toBe('Exact Match');
    });

    it('should handle reference without @ prefix', async () => {
      const mockStrings = {
        test: 'Test Value',
      };
      mockLoadStringFile.mockResolvedValue(mockStrings);

      const result = await service.tryLoadFromRef('file:test');

      expect(result).toBe('Test Value');
    });
  });

  describe('batchFunction', () => {
    it('should batch load multiple string files', async () => {
      const mockStrings1 = { key1: 'Value 1' };
      const mockStrings2 = { key2: 'Value 2' };
      mockLoadStringFile.mockResolvedValueOnce(mockStrings1).mockResolvedValueOnce(mockStrings2);

      const result = await StringFileLoader.batchFunction(['file1', 'file2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockStrings1);
      expect(result[1]).toEqual(mockStrings2);
    });
  });
});
