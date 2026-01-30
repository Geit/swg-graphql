import { describe, it, expect } from 'vitest';

import TAGIFY, { STRUCTURE_TYPE_IDS } from './tagify';

describe('TAGIFY', () => {
  it('should convert a 4-character string to a consistent integer', () => {
    const result = TAGIFY('FORM');
    expect(typeof result).toBe('number');
    expect(result).toBe(TAGIFY('FORM'));
  });

  it('should return different values for different inputs', () => {
    const form = TAGIFY('FORM');
    const data = TAGIFY('DATA');
    expect(form).not.toBe(data);
  });

  it('should handle the BUIO tag', () => {
    const result = TAGIFY('BUIO');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('should produce consistent results', () => {
    const results = Array.from({ length: 5 }, () => TAGIFY('TEST'));
    expect(new Set(results).size).toBe(1);
  });
});

describe('STRUCTURE_TYPE_IDS', () => {
  it('should be an array of 4 elements', () => {
    expect(STRUCTURE_TYPE_IDS).toHaveLength(4);
  });

  it('should contain only numbers', () => {
    STRUCTURE_TYPE_IDS.forEach(id => {
      expect(typeof id).toBe('number');
    });
  });

  it('should contain BUIO, HINO, INSO, MINO tags', () => {
    expect(STRUCTURE_TYPE_IDS).toContain(TAGIFY('BUIO'));
    expect(STRUCTURE_TYPE_IDS).toContain(TAGIFY('HINO'));
    expect(STRUCTURE_TYPE_IDS).toContain(TAGIFY('INSO'));
    expect(STRUCTURE_TYPE_IDS).toContain(TAGIFY('MINO'));
  });
});
