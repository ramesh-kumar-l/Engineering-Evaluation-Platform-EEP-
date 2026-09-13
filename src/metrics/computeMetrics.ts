import { computePrimaryMetrics } from './primaryMetrics.js';
import { computeSecondaryMetrics } from './secondaryMetrics.js';
import type { RunMetricsInput } from './metricsInput.js';
import type { Metric } from '../domain/metric/metric.schema.js';

/**
 * Computes every metric currently derivable for one completed, evaluated run — the Phase 5 entry
 * point. See project-memory-bank/08-metrics.md for the target metric set and
 * [[phases/phase-05]] for which of those are actually implemented yet. Per the anti-goal in
 * 08-metrics.md, this never collapses the result into a single composite score — callers get one
 * `Metric` record per name, each independently drillable back to `runId`.
 */
export function computeRunMetrics(input: RunMetricsInput): Metric[] {
  return [...computePrimaryMetrics(input), ...computeSecondaryMetrics(input)];
}
