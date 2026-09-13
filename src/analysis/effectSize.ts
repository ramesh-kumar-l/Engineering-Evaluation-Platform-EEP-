import { InsufficientSampleSizeError, mean, sampleVariance } from './stats.js';

export type EffectSizeMeasure = 'cohens-d' | 'cohens-h';
export type EffectSizeMagnitude = 'negligible' | 'small' | 'medium' | 'large';

export interface EffectSizeResult {
  readonly measure: EffectSizeMeasure;
  /** Signed: positive means the second sample/proportion is larger, matching (b - a) direction. */
  readonly value: number;
  readonly magnitude: EffectSizeMagnitude;
}

/**
 * Cohen's (1988) conventional thresholds, applied to |value|. Deliberately the same thresholds
 * for both d and h — both are standardized-difference measures on a comparable scale, and Cohen
 * proposed h using the same 0.2/0.5/0.8 convention as d.
 */
function classifyMagnitude(absValue: number): EffectSizeMagnitude {
  if (absValue < 0.2) return 'negligible';
  if (absValue < 0.5) return 'small';
  if (absValue < 0.8) return 'medium';
  return 'large';
}

/**
 * Cohen's d for two independent samples of a continuous metric, using the pooled standard
 * deviation. Requires at least 2 observations in each sample (pooled variance is undefined
 * otherwise) — never approximated with a single-sample stand-in.
 */
export function cohensD(sampleA: readonly number[], sampleB: readonly number[]): EffectSizeResult {
  if (sampleA.length < 2 || sampleB.length < 2) {
    throw new InsufficientSampleSizeError(
      `cohensD() requires at least 2 observations in each sample, got ${String(sampleA.length)} and ${String(sampleB.length)}`,
    );
  }
  const nA = sampleA.length;
  const nB = sampleB.length;
  const pooledVariance =
    ((nA - 1) * sampleVariance(sampleA) + (nB - 1) * sampleVariance(sampleB)) / (nA + nB - 2);
  const pooledStdDev = Math.sqrt(pooledVariance);

  const value = pooledStdDev === 0 ? 0 : (mean(sampleB) - mean(sampleA)) / pooledStdDev;
  return { measure: 'cohens-d', value, magnitude: classifyMagnitude(Math.abs(value)) };
}

/**
 * Cohen's h for two proportions (e.g. task-success rate), via the arcsine transform. Unlike
 * Cohen's d this needs no variance estimate, so it is defined for any non-empty pair of trial
 * counts — including n=1 groups, which still yield a genuine (if noisy) proportion.
 */
export function cohensH(
  proportionA: { readonly successes: number; readonly trials: number },
  proportionB: { readonly successes: number; readonly trials: number },
): EffectSizeResult {
  for (const [label, p] of [
    ['proportionA', proportionA],
    ['proportionB', proportionB],
  ] as const) {
    if (!Number.isInteger(p.trials) || p.trials < 1) {
      throw new InsufficientSampleSizeError(`cohensH() requires at least 1 trial for ${label}`);
    }
    if (!Number.isInteger(p.successes) || p.successes < 0 || p.successes > p.trials) {
      throw new RangeError(`${label}.successes must be an integer between 0 and trials`);
    }
  }

  const phi = (p: number): number => 2 * Math.asin(Math.sqrt(p));
  const value = phi(proportionB.successes / proportionB.trials) - phi(proportionA.successes / proportionA.trials);
  return { measure: 'cohens-h', value, magnitude: classifyMagnitude(Math.abs(value)) };
}
