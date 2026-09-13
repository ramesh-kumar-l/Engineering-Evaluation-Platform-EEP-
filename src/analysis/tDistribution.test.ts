import { describe, expect, it } from 'vitest';
import { isConfidenceLevel, tCriticalValue } from './tDistribution.js';

describe('tCriticalValue', () => {
  it('matches published t-table values for small df', () => {
    expect(tCriticalValue(1, 0.95)).toBeCloseTo(12.706, 3);
    expect(tCriticalValue(9, 0.95)).toBeCloseTo(2.262, 3);
    expect(tCriticalValue(29, 0.99)).toBeCloseTo(2.756, 3);
  });

  it('falls back to the normal z-critical value beyond df=30', () => {
    expect(tCriticalValue(100, 0.95)).toBeCloseTo(1.959963984540054, 6);
    expect(tCriticalValue(1000, 0.9)).toBeCloseTo(1.6448536269514722, 6);
  });

  it('rejects a non-positive or non-integer degrees of freedom', () => {
    expect(() => tCriticalValue(0, 0.95)).toThrow(RangeError);
    expect(() => tCriticalValue(-1, 0.95)).toThrow(RangeError);
    expect(() => tCriticalValue(2.5, 0.95)).toThrow(RangeError);
  });
});

describe('isConfidenceLevel', () => {
  it('accepts only the three supported levels', () => {
    expect(isConfidenceLevel(0.95)).toBe(true);
    expect(isConfidenceLevel(0.975)).toBe(false);
  });
});
