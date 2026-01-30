import { describe, it, expect } from 'vitest';

import { calcZScore, getZPercentile } from './statisticsUtils';

describe('statisticsUtils', () => {
  describe('calcZScore', () => {
    it('should calculate z-score correctly for value at mean', () => {
      const result = calcZScore(100, 10, 100);

      expect(result).toBe(0);
    });

    it('should calculate positive z-score for value above mean', () => {
      const result = calcZScore(100, 10, 110);

      expect(result).toBe(1);
    });

    it('should calculate negative z-score for value below mean', () => {
      const result = calcZScore(100, 10, 90);

      expect(result).toBe(-1);
    });

    it('should calculate z-score for multiple standard deviations', () => {
      const result = calcZScore(50, 5, 65);

      expect(result).toBe(3);
    });

    it('should handle fractional z-scores', () => {
      const result = calcZScore(100, 20, 110);

      expect(result).toBe(0.5);
    });
  });

  describe('getZPercentile', () => {
    it('should return 0.5 (50th percentile) for z-score of 0', () => {
      const result = getZPercentile(0);

      expect(result).toBeCloseTo(0.5, 2);
    });

    it('should return approximately 0.84 for z-score of 1', () => {
      const result = getZPercentile(1);

      // 84.13% of values fall below 1 standard deviation above mean
      expect(result).toBeCloseTo(0.8413, 2);
    });

    it('should return approximately 0.16 for z-score of -1', () => {
      const result = getZPercentile(-1);

      // 15.87% of values fall below 1 standard deviation below mean
      expect(result).toBeCloseTo(0.1587, 2);
    });

    it('should return approximately 0.975 for z-score of 2', () => {
      const result = getZPercentile(2);

      // 97.72% of values fall below 2 standard deviations above mean
      expect(result).toBeCloseTo(0.9772, 2);
    });

    it('should return approximately 0.9987 for z-score of 3', () => {
      const result = getZPercentile(3);

      // 99.87% of values fall below 3 standard deviations above mean
      expect(result).toBeCloseTo(0.9987, 2);
    });

    it('should return 0 for z-score less than -6.5', () => {
      const result = getZPercentile(-7);

      expect(result).toBe(0);
    });

    it('should return 1 for z-score greater than 6.5', () => {
      const result = getZPercentile(7);

      expect(result).toBe(1);
    });

    it('should handle boundary z-score of -6.5', () => {
      const result = getZPercentile(-6.5);

      // At the boundary, the computation runs and may have minor floating point errors
      // The result should be very close to 0
      expect(result).toBeCloseTo(0, 5);
    });

    it('should handle boundary z-score of 6.5', () => {
      const result = getZPercentile(6.5);

      // At the boundary, the computation runs and may have minor floating point errors
      // The result should be very close to 1
      expect(result).toBeCloseTo(1, 5);
    });
  });

  describe('calcZScore and getZPercentile integration', () => {
    it('should calculate correct percentile for value at mean', () => {
      const zScore = calcZScore(100, 10, 100);
      const percentile = getZPercentile(zScore);

      expect(percentile).toBeCloseTo(0.5, 2);
    });

    it('should calculate correct percentile for value 1 std dev above mean', () => {
      const zScore = calcZScore(100, 10, 110);
      const percentile = getZPercentile(zScore);

      expect(percentile).toBeCloseTo(0.8413, 2);
    });

    it('should calculate correct percentile for value 2 std dev below mean', () => {
      const zScore = calcZScore(100, 10, 80);
      const percentile = getZPercentile(zScore);

      expect(percentile).toBeCloseTo(0.0228, 2);
    });
  });
});
