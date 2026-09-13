import { describe, expect, it } from 'vitest';
import { meanConfidenceInterval, proportionConfidenceInterval } from './confidenceInterval.js';
import { InsufficientSampleSizeError } from './stats.js';

describe('meanConfidenceInterval', () => {
  it('computes a 95% CI matching a hand-worked t-interval example', () => {
    // n=8, mean=5, sample stddev ~2.13809 (see stats.test.ts), df=7, t(0.95,7)=2.365
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const ci = meanConfidenceInterval(values, 0.95);
    expect(ci.pointEstimate).toBe(5);
    const expectedMargin = 2.365 * (2.13809 / Math.sqrt(8));
    expect(ci.marginOfError).toBeCloseTo(expectedMargin, 2);
    expect(ci.lower).toBeCloseTo(5 - expectedMargin, 2);
    expect(ci.upper).toBeCloseTo(5 + expectedMargin, 2);
    expect(ci.level).toBe(0.95);
  });

  it('throws InsufficientSampleSizeError for fewer than 2 values', () => {
    expect(() => meanConfidenceInterval([5], 0.95)).toThrow(InsufficientSampleSizeError);
    expect(() => meanConfidenceInterval([], 0.95)).toThrow(InsufficientSampleSizeError);
  });

  it('produces a wider interval at a higher confidence level, all else equal', () => {
    const values = [10, 12, 11, 14, 9, 13];
    const ci90 = meanConfidenceInterval(values, 0.9);
    const ci99 = meanConfidenceInterval(values, 0.99);
    expect(ci99.marginOfError).toBeGreaterThan(ci90.marginOfError);
  });
});

describe('proportionConfidenceInterval', () => {
  it('matches a known Wilson interval worked example (15/20 successes, 95%)', () => {
    const ci = proportionConfidenceInterval(15, 20, 0.95);
    expect(ci.pointEstimate).toBe(0.75);
    expect(ci.lower).toBeCloseTo(0.5313, 2);
    expect(ci.upper).toBeCloseTo(0.8882, 2);
  });

  it('stays within [0, 1] even at the extremes', () => {
    const allSuccess = proportionConfidenceInterval(3, 3, 0.95);
    expect(allSuccess.upper).toBeLessThanOrEqual(1);
    const allFailure = proportionConfidenceInterval(0, 3, 0.95);
    expect(allFailure.lower).toBeGreaterThanOrEqual(0);
  });

  it('throws for zero trials', () => {
    expect(() => proportionConfidenceInterval(0, 0, 0.95)).toThrow(InsufficientSampleSizeError);
  });

  it('rejects successes outside [0, trials]', () => {
    expect(() => proportionConfidenceInterval(5, 3, 0.95)).toThrow(RangeError);
    expect(() => proportionConfidenceInterval(-1, 3, 0.95)).toThrow(RangeError);
  });
});
