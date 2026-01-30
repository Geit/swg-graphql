import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CrcLookupService } from './CrcLookupService';

// Mock the CrcTableReader module
vi.mock('../utils/CrcTableReader', () => ({
  loadCrcLookupTable: vi.fn().mockResolvedValue(new Map<number, string>()),
}));

describe('CrcLookupService', () => {
  let service: CrcLookupService;
  let mockLoadCrcLookupTable: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();

    const { loadCrcLookupTable } = await import('../utils/CrcTableReader');
    mockLoadCrcLookupTable = loadCrcLookupTable as ReturnType<typeof vi.fn>;

    const mockTable = new Map<number, string>([
      [12345, 'object/creature/player/human_male.iff'],
      [67890, 'object/tangible/weapon/rifle.iff'],
    ]);
    mockLoadCrcLookupTable.mockResolvedValue(mockTable);

    service = new CrcLookupService();
  });

  describe('lookupCrc', () => {
    it('should return the template path for a known CRC', async () => {
      const result = await service.lookupCrc(12345);

      expect(result).toBe('object/creature/player/human_male.iff');
    });

    it('should return another template path for a different CRC', async () => {
      const result = await service.lookupCrc(67890);

      expect(result).toBe('object/tangible/weapon/rifle.iff');
    });

    it('should return undefined for an unknown CRC', async () => {
      const result = await service.lookupCrc(99999);

      expect(result).toBeUndefined();
    });
  });

  describe('crcTable', () => {
    it('should load the CRC lookup table from the correct file', () => {
      expect(mockLoadCrcLookupTable).toHaveBeenCalledWith('misc/object_template_crc_string_table.iff');
    });
  });
});
