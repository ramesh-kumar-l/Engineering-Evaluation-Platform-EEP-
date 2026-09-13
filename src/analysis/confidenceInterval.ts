import { InsufficientSampleSizeError, mean, standardError } from './stats.js';
import { tCriticalValue, type ConfidenceLevel } from './tDistribution.js';

export interface ConfidenceInterval {
  readonly pointEstimate: number;
  readonly lower: number;
  readonly upper: number;
  readonly marginOfError: number;
  readonly level: ConfidenceLevel;
}

/**
 * Confidence interval for a sample mean, using the t-distribution (correct for small samples,
 * converges to the normal approximation as n grows — see tDistribution.ts). Requires at least 2
 * values: a single observation has no estimable variance, and reporting a zero-width interval for
 * n=1 would misrepresent certainty that doesn't exist (same "never fabricate" discipline as
 * ADR-008/ADR-009).
 */
export function meanConfidenceInterval(
  values: readonly number[],
  level: ConfidenceLevel,
): ConfidenceInterval {
  if (values.length < 2) {
    throw new InsufficientSampleSizeError(
      `meanConfidenceInterval() requires at least 2 values, got ${String(values.length)}`,
      values.length,
    );
  }
  const pointEstimate = mean(values);
  const marginOfError = tCriticalValue(values.length - 1, level) * standardError(values);
  return {
    pointEstimate,
    lower: pointEstimate - marginOfError,
    upper: pointEstimate + marginOfError,
    marginOfError,
    level,
  };
}

const Z_FOR_WILSON: Record<ConfidenceLevel, number> = {
  0.9: 1.6448536269514722,
  0.95: 1.959963984540054,
  0.99: 2.5758293035489004,
};

/**
 * Wilson score interval for a proportion (e.g. task-success rate across repeated runs) — chosen
 * over the naive normal approximation because it stays well-behaved at small n and at proportions
 * near 0 or 1, both of which are common here (a handful of repeated runs, and a genuinely
 * all-pass or all-fail condition). Requires at least 1 trial.
 */
export function proportionConfidenceInterval(
  successes: number,
  trials: number,
  level: ConfidenceLevel,
): ConfidenceInterval {
  if (!Number.isInteger(trials) || trials < 1) {
    throw new InsufficientSampleSizeError(
      `proportionConfidenceInterval() requires at least 1 trial, got ${String(trials)}`,
      trials,
    );
  }
  if (!Number.isInteger(successes) || successes < 0 || successes > trials) {
    throw new RangeError('successes must be an integer between 0 and trials');
  }

  const z = Z_FOR_WILSON[level];
  const n = trials;
  const p = successes / n;
  const z2 = z * z;

  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const halfWidth =
    (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denominator;

  return {
    pointEstimate: p,
    lower: Math.max(0, center - halfWidth),
    upper: Math.min(1, center + halfWidth),
    marginOfError: halfWidth,
    level,
  };
}
