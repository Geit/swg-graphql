import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartBuffer } from 'smart-buffer';

import { loadStringFile } from './StringFileReader';

vi.mock('fs/promises');

function buildStfBuffer(entries: Array<{ id: number; stringId: string; text: string }>): Buffer {
  const buffer = SmartBuffer.fromSize(1024);

  // 9 bytes header (magic numbers)
  buffer.writeBuffer(Buffer.alloc(9));

  // Number of entries
  buffer.writeUInt32LE(entries.length);

  // Text block - write all texts first
  for (const entry of entries) {
    buffer.writeUInt32LE(entry.id); // id
    buffer.writeUInt32LE(0); // crc (skipped when reading)
    buffer.writeUInt32LE(entry.text.length); // bufLength in characters
    buffer.writeString(entry.text, 'utf16le'); // text in UTF-16LE
  }

  // Names block - write all string IDs
  for (const entry of entries) {
    buffer.writeUInt32LE(entry.id); // id
    buffer.writeUInt32LE(entry.stringId.length); // bufLength
    buffer.writeString(entry.stringId, 'ascii'); // stringId
  }

  return buffer.toBuffer();
}

describe('loadStringFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should load and parse a string file correctly', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildStfBuffer([
      { id: 1, stringId: 'greeting', text: 'Hello' },
      { id: 2, stringId: 'farewell', text: 'Goodbye' },
    ]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadStringFile('test');

    expect(result).toEqual({
      greeting: 'Hello',
      farewell: 'Goodbye',
    });
  });

  it('should handle unicode text correctly', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildStfBuffer([{ id: 1, stringId: 'unicode_test', text: 'Héllo Wörld' }]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadStringFile('unicode');

    expect(result).toEqual({
      // eslint-disable-next-line camelcase
      unicode_test: 'Héllo Wörld',
    });
  });

  it('should return empty object when file does not exist', async () => {
    const fs = await import('fs/promises');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* do nothing */
    });

    vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

    const result = await loadStringFile('nonexistent');

    expect(result).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle empty file with zero entries', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildStfBuffer([]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadStringFile('empty');

    expect(result).toEqual({});
  });

  it('should handle single entry', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildStfBuffer([{ id: 42, stringId: 'single', text: 'Only One' }]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadStringFile('single');

    expect(result).toEqual({
      single: 'Only One',
    });
  });
});
