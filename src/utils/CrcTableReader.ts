import fs from 'fs/promises';
import path from 'path';

import { SmartBuffer } from 'smart-buffer';

import { IffReader } from './IFFReader';

export async function loadCrcLookupTable(fileName: string) {
  console.log('loading CRC Lookup table');
  const filePath = path.join(__dirname, '../../data', `${fileName}`);
  const file = await fs.readFile(filePath);

  const iffReader = new IffReader(file);
  iffReader.enterForm('CSTB');
  iffReader.enterForm('0000');

  iffReader.enterChunk('DATA');
  const metadata = SmartBuffer.fromBuffer(iffReader.getChunkData());
  iffReader.exitChunk();

  iffReader.enterChunk('CRCT');
  const crcData = SmartBuffer.fromBuffer(iffReader.getChunkData());
  iffReader.exitChunk();

  // iffReader.enterChunk('STRT');
  // const stringOffsetData = SmartBuffer.fromBuffer(iffReader.getChunkData());
  // iffReader.exitChunk();

  iffReader.enterChunk('STNG');
  const stringTableData = SmartBuffer.fromBuffer(iffReader.getChunkData());
  iffReader.exitChunk();

  const numRows = metadata.readUInt32LE();

  const lookupTable = new Map<number, string>();

  for (let i = 0; i < numRows; i++) {
    const crc = crcData.readUInt32LE();
    const string = stringTableData.readStringNT();
    lookupTable.set(crc, string);
  }

  console.log('Loaded CRC table...');
  return lookupTable;
}
