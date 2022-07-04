import fs from 'fs/promises';
import path from 'path';

import { SmartBuffer } from 'smart-buffer';

export const loadStringFile = async (fileName: string): Promise<Record<string, string | undefined>> => {
  const stringMap: Record<string, string> = {};
  const filePath = path.join(__dirname, '../../data/string/en', `${fileName}.stf`);
  let file: Buffer;
  try {
    file = await fs.readFile(filePath);
  } catch (err) {
    console.error(err);
    return stringMap;
  }

  // This map is used to store a LUT of IDS -> text.
  const stringText = new Map<number, string>();
  const buffer = SmartBuffer.fromBuffer(file);

  // Skip the first 9 bytes of the file, they contain magic numbers and stuff we don't care about.
  buffer.readOffset += 9;

  const numEntries = buffer.readUInt32LE();

  // We can now loop over the string text block
  for (let i = 0; i < numEntries; i++) {
    const id = buffer.readUInt32LE();

    //const crc = buffer.readUInt32LE();
    buffer.readOffset += 4;

    // Buf length is the length of the string in characters.
    const bufLength = buffer.readUInt32LE();

    // In UTF 16, each character is 2 bytes, so we multiply the character length of the string by 2.
    const text = buffer.readString(bufLength * 2, 'utf16le');
    stringText.set(id, text);
  }

  // Then we loop over the string names block
  for (let i = 0; i < numEntries; i++) {
    const id = buffer.readUInt32LE();
    const bufLength = buffer.readUInt32LE();
    const stringId = buffer.readString(bufLength, 'ascii');

    const text = stringText.get(id);
    if (text) {
      stringMap[stringId] = text;
    }
  }

  return stringMap;
};
