import fs from 'fs/promises';
import path from 'path';

import { Parser } from 'binary-parser';
import { SmartBuffer } from 'smart-buffer';

import { IffReader } from './IFFReader';

/**
 * The datatable format is a fairly simple IFF file consisting of:
 *  DTII form
 *  --> VERSION form (e.g 0001)
 *  ----> COLS
 *  ------> [int32] colCount
 *  ------> [...c_str[colCount]] columnName
 *  ----> TYPE
 *  ------> [...c_str[colCount]] column data type
 *  ----> ROWS
 *  ------> [int32] rowCount
 *  ------> [...custom[rowCount]] Format depends on COLS + TYPE.
 *
 *
 * Version 0 uses an enum for TYPEs, version 1 uses strings.
 */

interface ColumnNames {
  numCols: number;
  columnNames: string[];
}

const COLSParser = Parser.start()
  .endianess('little')
  .uint32('numCols')
  .array('columnNames', {
    type: Parser.start().string('text', {
      zeroTerminated: true,
    }),
    length: 'numCols',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatter: arr => arr.map((item: any) => item.text),
  });

interface ColumnTypes {
  columnTypes: string[];
}

const TYPEParser = Parser.start()
  .endianess('little')
  .array('columnTypes', {
    type: Parser.start().string('text', {
      zeroTerminated: true,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatter: arr => arr.map((item: any) => item.text),
    readUntil: 'eof',
  });

export async function loadDatatable<T extends object>(fileName: string) {
  const filePath = path.join(__dirname, '../../data/datatables', `${fileName}`);
  const file = await fs.readFile(filePath);

  const iffReader = new IffReader(file);
  iffReader.enterForm('DTII');
  iffReader.enterForm('0001');

  iffReader.enterChunk('COLS');
  const colsData = iffReader.getChunkData();
  iffReader.exitChunk();

  iffReader.enterChunk('TYPE');
  const typesData = iffReader.getChunkData();
  iffReader.exitChunk();

  iffReader.enterChunk('ROWS');
  const rowsData = iffReader.getChunkData();
  iffReader.exitChunk();

  const rowsBuffer = SmartBuffer.fromBuffer(rowsData);

  const cols: ColumnNames = COLSParser.parse(colsData);
  const colTypes: ColumnTypes = TYPEParser.parse(typesData);

  if (cols.numCols !== cols.columnNames.length || cols.numCols !== colTypes.columnTypes.length)
    throw new Error('Column count mismatch in datatable, cannot continue loading!');

  // TODO:
  // Need to take columns from basic types + namee
  // to being enriched with default values
  // + handle enums
  const getValueForColumn = (buffer: SmartBuffer, type: string) => {
    switch (type[0]) {
      case 'v':
      case 'i':
      case 'b':
      case 'e':
      case 'z':
      case 'h':
        return buffer.readInt32LE();

      case 'f':
        return buffer.readFloatLE();

      case 's':
      case 'p':
        return buffer.readStringNT();

      default:
        throw new Error(`Unrecognised column type ${type}`);
    }
  };

  const numRows = rowsBuffer.readInt32LE();

  const resolvedRows = [];

  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    const row: T = {} as T;

    for (let colIdx = 0; colIdx < cols.numCols; colIdx++) {
      const columnName = cols.columnNames[colIdx];
      const columnType = colTypes.columnTypes[colIdx];

      // @ts-expect-error TODO: Make generics work with this line
      row[columnName] = getValueForColumn(rowsBuffer, columnType);
    }

    resolvedRows.push(row);
  }

  return resolvedRows;
}
