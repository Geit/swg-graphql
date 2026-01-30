import { describe, it, expect } from 'vitest';

import { isPresent, subsetOf } from './utility-types';

describe('isPresent', () => {
  it('should return true for defined values', () => {
    expect(isPresent(0)).toBe(true);
    expect(isPresent('')).toBe(true);
    expect(isPresent(false)).toBe(true);
    expect(isPresent([])).toBe(true);
    expect(isPresent({})).toBe(true);
    expect(isPresent('hello')).toBe(true);
    expect(isPresent(123)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isPresent(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isPresent(undefined)).toBe(false);
  });

  it('should work as a type guard in filter', () => {
    const array: (string | null | undefined)[] = ['a', null, 'b', undefined, 'c'];
    const filtered = array.filter(isPresent);
    expect(filtered).toEqual(['a', 'b', 'c']);
  });
});

describe('subsetOf', () => {
  it('should return true when array is a subset of superset', () => {
    expect(subsetOf([1, 2], [1, 2, 3, 4])).toBe(true);
    expect(subsetOf(['a'], ['a', 'b', 'c'])).toBe(true);
  });

  it('should return true for empty array', () => {
    expect(subsetOf([], [1, 2, 3])).toBe(true);
  });

  it('should return true when arrays are equal', () => {
    expect(subsetOf([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('should return false when array is not a subset', () => {
    expect(subsetOf([1, 2, 5], [1, 2, 3, 4])).toBe(false);
    expect(subsetOf(['x'], ['a', 'b', 'c'])).toBe(false);
  });

  it('should return false when superset is empty but array is not', () => {
    expect(subsetOf([1], [])).toBe(false);
  });
});
