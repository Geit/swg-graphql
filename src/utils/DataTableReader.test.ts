import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartBuffer } from 'smart-buffer';

import { loadDatatable } from './DataTableReader';

vi.mock('fs/promises');

interface Column {
  name: string;
  type: string;
}

function buildDtiiBuffer(columns: Column[], rows: Array<Record<string, unknown>>): Buffer {
  const buffer = SmartBuffer.fromSize(8192);

  // FORM DTII header
  buffer.writeString('FORM', 'ascii');
  const formSizeOffset = buffer.writeOffset;
  buffer.writeUInt32BE(0); // placeholder
  buffer.writeString('DTII', 'ascii');

  // Inner FORM 0001
  buffer.writeString('FORM', 'ascii');
  const innerFormSizeOffset = buffer.writeOffset;
  buffer.writeUInt32BE(0); // placeholder
  buffer.writeString('0001', 'ascii');

  // COLS chunk
  const colsBuffer = SmartBuffer.fromSize(1024);
  colsBuffer.writeUInt32LE(columns.length);
  for (const col of columns) {
    colsBuffer.writeStringNT(col.name);
  }
  const colsData = colsBuffer.toBuffer();
  buffer.writeString('COLS', 'ascii');
  buffer.writeUInt32BE(colsData.length);
  buffer.writeBuffer(colsData);

  // TYPE chunk
  const typeBuffer = SmartBuffer.fromSize(1024);
  for (const col of columns) {
    typeBuffer.writeStringNT(col.type);
  }
  const typeData = typeBuffer.toBuffer();
  buffer.writeString('TYPE', 'ascii');
  buffer.writeUInt32BE(typeData.length);
  buffer.writeBuffer(typeData);

  // ROWS chunk
  const rowsBuffer = SmartBuffer.fromSize(4096);
  rowsBuffer.writeInt32LE(rows.length);

  for (const row of rows) {
    for (const col of columns) {
      const value = row[col.name];
      switch (col.type[0]) {
        case 'b': // boolean
          rowsBuffer.writeInt32LE(value ? 1 : 0);
          break;
        case 'i': // int
        case 'e': // enum
        case 'h': // hash
        case 'v':
        case 'z':
          rowsBuffer.writeInt32LE(value as number);
          break;
        case 'f': // float
          rowsBuffer.writeFloatLE(value as number);
          break;
        case 's': // string
        case 'p': // path
          rowsBuffer.writeStringNT(value as string);
          break;
        default:
          throw new Error('Invalid column type!');
      }
    }
  }
  const rowsData = rowsBuffer.toBuffer();
  buffer.writeString('ROWS', 'ascii');
  buffer.writeUInt32BE(rowsData.length);
  buffer.writeBuffer(rowsData);

  // Fix sizes
  const totalSize = buffer.writeOffset;
  const innerFormSize = totalSize - innerFormSizeOffset - 4;
  buffer.writeUInt32BE(innerFormSize, innerFormSizeOffset);
  const formSize = totalSize - formSizeOffset - 4;
  buffer.writeUInt32BE(formSize, formSizeOffset);

  return buffer.toBuffer();
}

describe('loadDatatable', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should load a datatable with string columns', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildDtiiBuffer(
      [
        { name: 'name', type: 's' },
        { name: 'path', type: 'p' },
      ],
      [
        { name: 'Item1', path: 'path/to/item1' },
        { name: 'Item2', path: 'path/to/item2' },
      ]
    );

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadDatatable<{ name: string; path: string }>({
      fileName: 'test.iff',
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Item1', path: 'path/to/item1' });
    expect(result[1]).toEqual({ name: 'Item2', path: 'path/to/item2' });
  });

  it('should load a datatable with integer columns', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildDtiiBuffer(
      [
        { name: 'id', type: 'i' },
        { name: 'count', type: 'i' },
      ],
      [
        { id: 1, count: 100 },
        { id: 2, count: 200 },
      ]
    );

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadDatatable<{ id: number; count: number }>({
      fileName: 'ints.iff',
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, count: 100 });
    expect(result[1]).toEqual({ id: 2, count: 200 });
  });

  it('should load a datatable with float columns', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildDtiiBuffer([{ name: 'value', type: 'f' }], [{ value: 3.14 }, { value: 2.718 }]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadDatatable<{ value: number }>({
      fileName: 'floats.iff',
    });

    expect(result).toHaveLength(2);
    expect(result[0].value).toBeCloseTo(3.14, 2);
    expect(result[1].value).toBeCloseTo(2.718, 2);
  });

  it('should load a datatable with boolean columns', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildDtiiBuffer([{ name: 'enabled', type: 'b' }], [{ enabled: true }, { enabled: false }]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadDatatable<{ enabled: boolean }>({
      fileName: 'bools.iff',
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ enabled: true });
    expect(result[1]).toEqual({ enabled: false });
  });

  it('should apply camelCase option to column names', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildDtiiBuffer(
      [
        { name: 'player_name', type: 's' },
        { name: 'max_health', type: 'i' },
      ],
      // eslint-disable-next-line camelcase
      [{ player_name: 'Test', max_health: 100 }]
    );

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadDatatable<{ playerName: string; maxHealth: number }>({
      fileName: 'camel.iff',
      camelcase: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ playerName: 'Test', maxHealth: 100 });
  });

  it('should handle mixed column types', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildDtiiBuffer(
      [
        { name: 'name', type: 's' },
        { name: 'level', type: 'i' },
        { name: 'multiplier', type: 'f' },
        { name: 'active', type: 'b' },
      ],
      [{ name: 'Player', level: 50, multiplier: 1.5, active: true }]
    );

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadDatatable<{
      name: string;
      level: number;
      multiplier: number;
      active: boolean;
    }>({
      fileName: 'mixed.iff',
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Player');
    expect(result[0].level).toBe(50);
    expect(result[0].multiplier).toBeCloseTo(1.5, 2);
    expect(result[0].active).toBe(true);
  });

  it('should handle empty datatable', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildDtiiBuffer([{ name: 'id', type: 'i' }], []);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadDatatable<{ id: number }>({
      fileName: 'empty.iff',
    });

    expect(result).toHaveLength(0);
  });

  it('should handle enum type as integer', async () => {
    const fs = await import('fs/promises');
    const mockBuffer = buildDtiiBuffer([{ name: 'type', type: 'e' }], [{ type: 1 }, { type: 2 }, { type: 3 }]);

    vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

    const result = await loadDatatable<{ type: number }>({
      fileName: 'enum.iff',
    });

    expect(result).toEqual([{ type: 1 }, { type: 2 }, { type: 3 }]);
  });
});
