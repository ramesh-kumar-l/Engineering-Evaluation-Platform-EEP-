import type { MetricName } from '../domain/metric/metric.schema.js';
import type { TaskCategory, TaskComplexity } from '../domain/task/task.schema.js';
import type { RunId } from '../domain/common/ids.js';
import type { Metric } from '../domain/metric/metric.schema.js';

/**
 * Everything src/analysis/ needs about one completed, metric-computed run — deliberately
 * structural, not a re-export of any harness/evaluation type, matching the same one-way-
 * dependency discipline `RunMetricsInput` (src/metrics/metricsInput.ts) already established.
 * Callers assemble this from a `Run` (conditionName resolved from its `Condition`) and a `Task`
 * (category/complexity) plus that run's already-computed `Metric[]` (from `computeRunMetrics`).
 */
export interface RunAnalysisRecord {
  readonly runId: RunId;
  readonly conditionName: string;
  readonly taskCategory: TaskCategory;
  readonly taskComplexity: TaskComplexity;
  readonly metrics: readonly Metric[];
}

/**
 * Whether a metric's values are best summarized as a mean-of-continuous-values (Student's t
 * interval, Cohen's d) or as a proportion-of-successes (Wilson interval, Cohen's h). Only
 * `task-success` is a true per-run Bernoulli outcome (exactly 0 or 1 by construction — see
 * src/metrics/primaryMetrics.ts); every other metric, even ratio-like ones such as
 * `provenance-completeness`, is treated as continuous, which is always statistically valid.
 */
export type MetricKind = 'continuous' | 'proportion';

const PROPORTION_METRICS: ReadonlySet<MetricName> = new Set(['task-success']);

export function metricKindFor(name: MetricName): MetricKind {
  return PROPORTION_METRICS.has(name) ? 'proportion' : 'continuous';
}

/** Extracts one metric's values, in record order, from a set of `RunAnalysisRecord`s. */
export function extractMetricValues(records: readonly RunAnalysisRecord[], metricName: MetricName): number[] {
  const values: number[] = [];
  for (const record of records) {
    const metric = record.metrics.find((m) => m.name === metricName);
    if (metric) values.push(metric.value);
  }
  return values;
}
