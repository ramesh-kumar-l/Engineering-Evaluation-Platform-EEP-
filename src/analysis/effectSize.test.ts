import { describe, expect, it } from 'vitest';
import { cohensD, cohensH } from './effectSize.js';
import { InsufficientSampleSizeError } from './stats.js';

describe('cohensD', () => {
  it('matches a hand-worked example (two shifted samples of equal spread)', () => {
    const sampleA = [1, 2, 3, 4, 5];
    const sampleB = [3, 4, 5, 6, 7];
    const result = cohensD(sampleA, sampleB);
    expect(result.measure).toBe('cohens-d');
    expect(result.value).toBeCloseTo(1.2649, 3);
    expect(result.magnitude).toBe('large');
  });

  it('is signed so a lower sampleB reads as negative', () => {
    const result = cohensD([3, 4, 5, 6, 7], [1, 2, 3, 4, 5]);
    expect(result.value).toBeLessThan(0);
  });

  it('classifies magnitude using Cohen\'s conventional thresholds', () => {
    // identical distributions -> d = 0 -> negligible
    expect(cohensD([1, 2, 3], [1, 2, 3]).magnitude).toBe('negligible');
  });

  it('throws with fewer than 2 observations in either sample', () => {
    expect(() => cohensD([1], [1, 2, 3])).toThrow(InsufficientSampleSizeError);
    expect(() => cohensD([1, 2, 3], [])).toThrow(InsufficientSampleSizeError);
  });
});

describe('cohensH', () => {
  it('matches a hand-worked arcsine-transform example (0.5 vs 0.8)', () => {
    const result = cohensH({ successes: 5, trials: 10 }, { successes: 8, trials: 10 });
    expect(result.measure).toBe('cohens-h');
    expect(result.value).toBeCloseTo(0.6435, 3);
    expect(result.magnitude).toBe('medium');
  });

  it('is defined even for n=1 trials on either side', () => {
    const result = cohensH({ successes: 0, trials: 1 }, { successes: 1, trials: 1 });
    expect(Number.isFinite(result.value)).toBe(true);
  });

  it('throws for zero trials', () => {
    expect(() => cohensH({ successes: 0, trials: 0 }, { successes: 1, trials: 2 })).toThrow(
      InsufficientSampleSizeError,
    );
  });

  it('rejects successes outside [0, trials]', () => {
    expect(() => cohensH({ successes: 5, trials: 2 }, { successes: 1, trials: 2 })).toThrow(RangeError);
  });
});
