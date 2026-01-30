import { describe, it, expect } from 'vitest';

import TAGIFY from './tagify';
import { IffReader } from './IFFReader';

// Helper to build a simple IFF buffer for testing
function buildSimpleIff(): Buffer {
  // Build a minimal IFF structure:
  // FORM (size) TEST
  //   DATA (size) [some bytes]

  const formTag = Buffer.from('FORM');
  const testSubtype = Buffer.from('TEST');
  const dataTag = Buffer.from('DATA');
  const dataContent = Buffer.from([0x01, 0x02, 0x03, 0x04]);

  // DATA chunk: tag (4) + size (4) + content
  const dataChunkSize = Buffer.alloc(4);
  dataChunkSize.writeUInt32BE(dataContent.length);
  const dataChunk = Buffer.concat([dataTag, dataChunkSize, dataContent]);

  // FORM: tag (4) + size (4) + subtype (4) + children
  const formContentSize = 4 + dataChunk.length; // subtype + DATA chunk
  const formSize = Buffer.alloc(4);
  formSize.writeUInt32BE(formContentSize);

  return Buffer.concat([formTag, formSize, testSubtype, dataChunk]);
}

// Helper to build nested FORM structure
function buildNestedIff(): Buffer {
  const formTag = Buffer.from('FORM');

  // Inner FORM with INFO chunk
  const infoTag = Buffer.from('INFO');
  const infoContent = Buffer.from([0xaa, 0xbb]);
  const infoSize = Buffer.alloc(4);
  infoSize.writeUInt32BE(infoContent.length);
  const infoChunk = Buffer.concat([infoTag, infoSize, infoContent]);

  const innerSubtype = Buffer.from('INNR');
  const innerFormContentSize = 4 + infoChunk.length;
  const innerFormSize = Buffer.alloc(4);
  innerFormSize.writeUInt32BE(innerFormContentSize);
  const innerForm = Buffer.concat([formTag, innerFormSize, innerSubtype, infoChunk]);

  // Outer FORM containing inner FORM
  const outerSubtype = Buffer.from('OUTR');
  const outerFormContentSize = 4 + innerForm.length;
  const outerFormSize = Buffer.alloc(4);
  outerFormSize.writeUInt32BE(outerFormContentSize);

  return Buffer.concat([formTag, outerFormSize, outerSubtype, innerForm]);
}

describe('IffReader', () => {
  describe('constructor', () => {
    it('should parse a simple IFF buffer', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);
      expect(reader.parsedData).toBeDefined();
      expect(reader.parsedData.children).toBeInstanceOf(Array);
    });
  });

  describe('enterForm and exitForm', () => {
    it('should enter a form by name', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      expect(() => reader.enterForm('TEST')).not.toThrow();
    });

    it('should throw when entering non-existent form', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      expect(() => reader.enterForm('NOPE')).toThrow('No form named NOPE found!');
    });

    it('should exit form and return to parent', () => {
      const buffer = buildNestedIff();
      const reader = new IffReader(buffer);

      reader.enterForm('OUTR');
      reader.enterForm('INNR');
      reader.exitForm();
      // Should be back at OUTR level, can re-enter INNR
      expect(() => reader.enterForm('INNR')).not.toThrow();
    });
  });

  describe('enterChunk and exitChunk', () => {
    it('should enter a chunk by name', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      reader.enterForm('TEST');
      expect(() => reader.enterChunk('DATA')).not.toThrow();
    });

    it('should throw when entering non-existent chunk', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      reader.enterForm('TEST');
      expect(() => reader.enterChunk('NOPE')).toThrow('No chunk named NOPE found!');
    });

    it('should throw when already in a chunk', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      reader.enterForm('TEST');
      reader.enterChunk('DATA');
      expect(() => reader.enterChunk('DATA')).toThrow('Already in a chunk!');
    });
  });

  describe('getChunkData', () => {
    it('should return chunk data as buffer', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      reader.enterForm('TEST');
      reader.enterChunk('DATA');

      const data = reader.getChunkData();
      expect(data).toBeInstanceOf(Buffer);
      expect(data).toEqual(Buffer.from([0x01, 0x02, 0x03, 0x04]));
    });

    it('should throw when not in a chunk', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      reader.enterForm('TEST');
      expect(() => reader.getChunkData()).toThrow('Not currently in a chunk!');
    });
  });

  describe('hasForm', () => {
    it('should return true when form exists', () => {
      const buffer = buildNestedIff();
      const reader = new IffReader(buffer);

      expect(reader.hasForm('OUTR')).toBe(true);
    });

    it('should return false when form does not exist', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      expect(reader.hasForm('NOPE')).toBe(false);
    });
  });

  describe('getFormNameCount', () => {
    it('should return count of forms with given name', () => {
      const buffer = buildSimpleIff();
      const reader = new IffReader(buffer);

      expect(reader.getFormNameCount('TEST')).toBe(1);
      expect(reader.getFormNameCount('NOPE')).toBe(0);
    });
  });

  describe('TAGIFY integration', () => {
    it('should correctly identify FORM tag', () => {
      expect(TAGIFY('FORM')).toBe(1179603533);
    });
  });
});
