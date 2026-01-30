import { describe, it, expect } from 'vitest';

import { getStringCrc } from './crc';

describe('getStringCrc', () => {
  it('should return consistent CRC for the same input', () => {
    const input = 'test';
    const crc1 = getStringCrc(input);
    const crc2 = getStringCrc(input);
    expect(crc1).toBe(crc2);
  });

  it('should return different CRCs for different inputs', () => {
    const crc1 = getStringCrc('hello');
    const crc2 = getStringCrc('world');
    expect(crc1).not.toBe(crc2);
  });

  it('should handle empty string', () => {
    const crc = getStringCrc('');
    expect(typeof crc).toBe('number');
  });

  it('should return a number', () => {
    const crc = getStringCrc('any string');
    expect(typeof crc).toBe('number');
  });
});
