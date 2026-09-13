import { describe, expect, it } from 'vitest';
import { mean, median, sampleStdDev, sampleVariance, standardError } from './stats.js';

describe('mean', () => {
  it('computes the arithmetic mean', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it('throws on an empty array', () => {
    expect(() => mean([])).toThrow(RangeError);
  });
});

describe('median', () => {
  it('returns the middle value for an odd-length array', () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it('averages the two middle values for an even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('throws on an empty array', () => {
    expect(() => median([])).toThrow(RangeError);
  });
});

describe('sampleVariance / sampleStdDev', () => {
  it('matches a known worked example (2, 4, 4, 4, 5, 5, 7, 9 -> variance 4.571..., stddev ~2.138)', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(sampleVariance(values)).toBeCloseTo(4.5714285714, 6);
    expect(sampleStdDev(values)).toBeCloseTo(2.13809, 4);
  });

  it('throws with fewer than 2 values', () => {
    expect(() => sampleVariance([1])).toThrow(RangeError);
    expect(() => sampleStdDev([])).toThrow(RangeError);
  });
});

describe('standardError', () => {
  it('is sampleStdDev divided by sqrt(n)', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(standardError(values)).toBeCloseTo(sampleStdDev(values) / Math.sqrt(values.length), 10);
  });
});
