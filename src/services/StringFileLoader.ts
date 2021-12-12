import fs from 'fs/promises';
import path from 'path';

// import { Parser } from 'binary-parser';
import DataLoader from 'dataloader';
import { Service } from 'typedi';

/**
 * The STF (String Table File) format is a little endian encoded file containing a list of string names
 * and a list of string values. This can be combined in order to provide a map that is used to look up
 * string values.
 *
 * The format is described below using the `binary-parser` node package. However, given the simplicity of the
 * format, I've rolled my own significantly faster implementation.
 */
// const STFStringText = new Parser()
//   .endianess('little')
//   // .uint32('id')
//   // .uint32('crc')
//   .skip(8)
//   .uint32('bufLength')
//   .string('stringText', {
//     encoding: 'utf-16le',
//     length() {
//       // @ts-ignore
//       return this!.bufLength * 2;
//     },
//   });

// const STFStringName = new Parser()
//   .endianess('little')
//   //.uint32('id')
//   .skip(4)
//   .uint32('bufLength')
//   .string('stringName', {
//     length: 'bufLength',
//   });

// const STFFile = new Parser()
//   .endianess('little')
//   .uint32('magic')
//   .bit8('version')
//   .uint32('nextUniqueId')
//   .uint32('numEntries')
//   .array('stringText', {
//     type: STFStringText,
//     length: 'numEntries',
//   })
//   .array('stringName', {
//     type: STFStringName,
//     length: 'numEntries',
//   });

@Service()
export class StringFileLoader {
  private dataloader = new DataLoader(StringFileLoader.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static batchFunction(fileNames: readonly string[]) {
    return Promise.all(
      fileNames.map(async fileName => {
        const stringMap: Record<string, string> = {};
        const filePath = path.join(__dirname, '../../data/string/en', `${fileName}.stf`);
        let file: Buffer;
        try {
          file = await fs.readFile(filePath);
        } catch (err) {
          console.error(err);
          return stringMap;
        }

        let offset = 9; // Skip the first 9 bytes of the file, they contain magic numbers and stuff we don't care about.
        const numEntries = file.readUInt32LE(offset);
        offset += 4; // We read 4 bytes with readUInt32LE, so we advance the offset. The offset is not managed for us anywhere in this block.
        const stringText = new Map<number, string>();

        // We can now loop over the string text block
        for (let i = 0; i < numEntries; i++) {
          const id = file.readUInt32LE(offset);
          offset += 4;
          // We skip the next 4 bytes of every string name entry, it simply contains the CRC.
          offset += 4;

          // Buf length is the length of the string in characters.
          const bufLength = file.readUInt32LE(offset);
          offset += 4;

          // In UTF 16, each character is 2 bytes, so we multiply the character length of the string by 2.
          const text = file.toString('utf16le', offset, offset + bufLength * 2);
          offset += bufLength * 2;
          stringText.set(id, text);
        }

        // Then we loop over the string names block
        for (let i = 0; i < numEntries; i++) {
          const id = file.readUInt32LE(offset);
          offset += 4;
          const bufLength = file.readUInt32LE(offset);
          offset += 4;
          const stringId = file.toString('ascii', offset, offset + bufLength);
          offset += bufLength;

          const text = stringText.get(id);
          if (text) {
            stringMap[stringId] = text;
          }
        }

        return stringMap;

        // The code below does the STF parsing using binary-parser. It's pretty slow even though it's much more readable, sadly.
        // const parsed = STFFile.parse(file);

        // // Hope/assume that STFs are in order and we don't actually have to do lookups?
        // const stfContents: Record<string, string> = {};
        // for (let i = 0; i < parsed.numEntries; i++) {
        //   stfContents[parsed.stringName[i].stringName] = parsed.stringText[i].stringText;
        // }

        // console.timeEnd(`parse:${fileName}`);
        // return stfContents;
      })
    );
  }
}
