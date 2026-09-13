/**
 * Two-tailed critical values for the Student's t-distribution, used to size confidence intervals
 * for a sample mean (see confidenceInterval.ts). Only three confidence levels are supported —
 * deliberately, rather than a hand-rolled inverse-t approximation of unproven accuracy: ADR-002
 * ([[14-decisions]]) chose "well-tested small libraries or hand-rolled statistics with unit
 * tests" over assuming a mature stats stack, and the honest way to satisfy that without a
 * numerical-analysis dependency is to use exact, published critical values rather than an
 * approximation formula that could be subtly wrong at the tails.
 */
export const CONFIDENCE_LEVELS = [0.9, 0.95, 0.99] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

/** Exact two-tailed standard-normal critical values — the df=Infinity limit of the t-table below. */
const Z_CRITICAL: Record<ConfidenceLevel, number> = {
  0.9: 1.6448536269514722,
  0.95: 1.959963984540054,
  0.99: 2.5758293035489004,
};

/**
 * Standard published two-tailed t-table, degrees of freedom 1-30 (source: any standard
 * statistics reference, e.g. NIST/SEMATECH e-Handbook table of critical t-values). Beyond df=30
 * the t-distribution is close enough to normal that the z-critical value is used instead —
 * common practice, and honestly a smaller approximation error than trying to hand-derive df>30
 * table rows.
 */
const T_TABLE: Record<number, Record<ConfidenceLevel, number>> = {
  1: { 0.9: 6.314, 0.95: 12.706, 0.99: 63.657 },
  2: { 0.9: 2.92, 0.95: 4.303, 0.99: 9.925 },
  3: { 0.9: 2.353, 0.95: 3.182, 0.99: 5.841 },
  4: { 0.9: 2.132, 0.95: 2.776, 0.99: 4.604 },
  5: { 0.9: 2.015, 0.95: 2.571, 0.99: 4.032 },
  6: { 0.9: 1.943, 0.95: 2.447, 0.99: 3.707 },
  7: { 0.9: 1.895, 0.95: 2.365, 0.99: 3.499 },
  8: { 0.9: 1.86, 0.95: 2.306, 0.99: 3.355 },
  9: { 0.9: 1.833, 0.95: 2.262, 0.99: 3.25 },
  10: { 0.9: 1.812, 0.95: 2.228, 0.99: 3.169 },
  11: { 0.9: 1.796, 0.95: 2.201, 0.99: 3.106 },
  12: { 0.9: 1.782, 0.95: 2.179, 0.99: 3.055 },
  13: { 0.9: 1.771, 0.95: 2.16, 0.99: 3.012 },
  14: { 0.9: 1.761, 0.95: 2.145, 0.99: 2.977 },
  15: { 0.9: 1.753, 0.95: 2.131, 0.99: 2.947 },
  16: { 0.9: 1.746, 0.95: 2.12, 0.99: 2.921 },
  17: { 0.9: 1.74, 0.95: 2.11, 0.99: 2.898 },
  18: { 0.9: 1.734, 0.95: 2.101, 0.99: 2.878 },
  19: { 0.9: 1.729, 0.95: 2.093, 0.99: 2.861 },
  20: { 0.9: 1.725, 0.95: 2.086, 0.99: 2.845 },
  21: { 0.9: 1.721, 0.95: 2.08, 0.99: 2.831 },
  22: { 0.9: 1.717, 0.95: 2.074, 0.99: 2.819 },
  23: { 0.9: 1.714, 0.95: 2.069, 0.99: 2.807 },
  24: { 0.9: 1.711, 0.95: 2.064, 0.99: 2.797 },
  25: { 0.9: 1.708, 0.95: 2.06, 0.99: 2.787 },
  26: { 0.9: 1.706, 0.95: 2.056, 0.99: 2.779 },
  27: { 0.9: 1.703, 0.95: 2.052, 0.99: 2.771 },
  28: { 0.9: 1.701, 0.95: 2.048, 0.99: 2.763 },
  29: { 0.9: 1.699, 0.95: 2.045, 0.99: 2.756 },
  30: { 0.9: 1.697, 0.95: 2.042, 0.99: 2.75 },
};

export function isConfidenceLevel(value: number): value is ConfidenceLevel {
  return (CONFIDENCE_LEVELS as readonly number[]).includes(value);
}

/**
 * Two-tailed critical value for `degreesOfFreedom` at the given confidence level. `degreesOfFreedom`
 * must be a positive integer (typically sampleSize - 1). Falls back to the z-critical value for
 * df > 30.
 */
export function tCriticalValue(degreesOfFreedom: number, level: ConfidenceLevel): number {
  if (!Number.isInteger(degreesOfFreedom) || degreesOfFreedom < 1) {
    throw new RangeError('degreesOfFreedom must be a positive integer');
  }
  if (degreesOfFreedom > 30) return Z_CRITICAL[level];
  const row = T_TABLE[degreesOfFreedom];
  if (!row) throw new RangeError(`no t-table row for degreesOfFreedom=${String(degreesOfFreedom)}`);
  return row[level];
}
