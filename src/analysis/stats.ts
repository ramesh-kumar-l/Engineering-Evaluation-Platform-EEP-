/**
 * Generic descriptive statistics with no domain knowledge (no Metric/Run/Task types) — the
 * building block every other file in src/analysis/ composes. See project-memory-bank/
 * phases/phase-07.md and ADR-011 in project-memory-bank/14-decisions.md.
 */

/**
 * Shared across confidenceInterval.ts and effectSize.ts: thrown when a caller asks for a
 * statistic that needs more observations than were provided, rather than silently returning a
 * misleading zero-width interval or an undefined effect size.
 */
export class InsufficientSampleSizeError extends Error {
  constructor(
    message: string,
    readonly sampleSize?: number,
  ) {
    super(message);
    this.name = 'InsufficientSampleSizeError';
  }
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) throw new RangeError('mean() requires at least one value');
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) throw new RangeError('median() requires at least one value');
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
}

/** Sample variance (n-1 denominator). Requires at least 2 values — variance of 1 point is undefined. */
export function sampleVariance(values: readonly number[]): number {
  if (values.length < 2) {
    throw new RangeError('sampleVariance() requires at least 2 values');
  }
  const m = mean(values);
  return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
}

export function sampleStdDev(values: readonly number[]): number {
  return Math.sqrt(sampleVariance(values));
}

/** Standard error of the mean: sample stddev / sqrt(n). Requires at least 2 values. */
export function standardError(values: readonly number[]): number {
  return sampleStdDev(values) / Math.sqrt(values.length);
}
