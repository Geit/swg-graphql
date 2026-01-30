import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartBuffer } from 'smart-buffer';

import { loadCrcLookupTable } from './CrcTableReader';

vi.mock('fs/promises');

function buildCstbBuffer(entries: Array<{ crc: number; str: string }>): Buffer {
  const buffer = SmartBuffer.fromSize(4096);

  // FORM header
  buffer.writeString('FORM', 'ascii');

  // We'll calculate and write the size later
  const formSizeOffset = buffer.writeOffset;
  buffer.writeUInt32BE(0); // placeholder for form size

  // CSTB subtype
  buffer.writeString('CSTB', 'ascii');

  // Inner FORM 0000
  buffer.writeString('FORM', 'ascii');
  const innerFormSizeOffset = buffer.writeOffset;
  buffer.writeUInt32BE(0); // placeholder
  buffer.writeString('0000', 'ascii');

  // DATA chunk - contains numRows
  buffer.writeString('DATA', 'ascii');
  buffer.writeUInt32BE(4); // chunk size
  buffer.writeUInt32LE(entries.length); // numRows

  // CRCT chunk - contains CRCs
  buffer.writeString('CRCT', 'ascii');
  buffer.writeUInt32BE(entries.length * 4); // chunk size
  for (const entry of entries) {
    buffer.writeUInt32LE(entry.crc);
  }

  // STRT chunk - we skip reading this, but it needs to exist in the structure
  // Actually looking at the code, STRT is commented out, so we skip it

  // STNG chunk - contains null-terminated strings
  buffer.writeString('STNG', 'ascii');
  const stngContent = SmartBuffer.fromSize(1024);
  for (const entry of entries) {
    stngContent.writeStringNT(entry.str);
  }
  const stngData = stngContent.toBuffer();
  buffer.writeUInt32BE(stngData.length);
  buffer.writeBuffer(stngData);

  // Now go back and fix the sizes
  const totalSize = buffer.writeOffset;

  // Inner form size = everything after the inner form size field until end
  // = total - (FORM + size + CSTB + FORM + size) = total - 20, then subtract 4 for subtype
  const innerFormSize = totalSize - innerFormSizeOffset - 4;
  buffer.writeUInt32BE(innerFormSize, innerFormSizeOffset);

  // Outer form size = everything after the outer form size field = total - 8
  const formSize = totalSize - formSizeOffset - 4;
  buffer.writeUInt32BE(formSize, formSizeOffset);

  return buffer.toBuffer();
}

describe('loadCrcLookupTable', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {
      /* do nothing */
    });
  });

  it('should load and parse a CRC lookup table', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildCstbBuffer([
      { crc: 12345, str: 'object/creature/player.iff' },
      { crc: 67890, str: 'object/weapon/sword.iff' },
    ]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadCrcLookupTable('test.crc');

    expect(result).toBeInstanceOf(Map);
    expect(result.get(12345)).toBe('object/creature/player.iff');
    expect(result.get(67890)).toBe('object/weapon/sword.iff');
  });

  it('should handle empty table', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildCstbBuffer([]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadCrcLookupTable('empty.crc');

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should handle single entry', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildCstbBuffer([{ crc: 99999, str: 'single/path.iff' }]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadCrcLookupTable('single.crc');

    expect(result.size).toBe(1);
    expect(result.get(99999)).toBe('single/path.iff');
  });

  it('should log loading messages', async () => {
    const fs = await import('fs/promises');
    const consoleSpy = vi.spyOn(console, 'log');
    const mockBuffer = buildCstbBuffer([]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    await loadCrcLookupTable('test.crc');

    expect(consoleSpy).toHaveBeenCalledWith('loading CRC Lookup table');
    expect(consoleSpy).toHaveBeenCalledWith('Loaded CRC table...');
  });
});
