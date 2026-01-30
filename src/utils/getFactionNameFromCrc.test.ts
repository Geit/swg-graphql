import { describe, it, expect } from 'vitest';

import getStringCrc from './crc';
import { getFactionNameFromCrc } from './getFactionNameFromCrc';

describe('getFactionNameFromCrc', () => {
  it('should return "Imperial" for the imperial CRC', () => {
    const imperialCrc = getStringCrc('imperial');
    expect(getFactionNameFromCrc(imperialCrc)).toBe('Imperial');
  });

  it('should return "Rebel" for the rebel CRC', () => {
    const rebelCrc = getStringCrc('rebel');
    expect(getFactionNameFromCrc(rebelCrc)).toBe('Rebel');
  });

  it('should return null for unknown CRC values', () => {
    expect(getFactionNameFromCrc(12345)).toBeNull();
    expect(getFactionNameFromCrc(0)).toBeNull();
    expect(getFactionNameFromCrc(-1)).toBeNull();
  });

  it('should return null for null input', () => {
    expect(getFactionNameFromCrc(null)).toBeNull();
  });
});
