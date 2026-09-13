import type { Metric, MetricName } from '../domain/metric/metric.schema.js';

/**
 * A metric summarized across multiple runs of the same Task×Condition pair. This is a
 * lightweight preview only — mean/median/sample-stddev over whatever runs the caller passes in.
 * It does NOT perform significance testing, confidence intervals, or outlier handling; that full
 * statistical rigor is Phase 7 (Experimental Analysis, project-memory-bank/13-roadmap.md). Phase
 * 5's job is only to define what a single run's metric is (see computeMetrics.ts) and to give a
 * correct, honest way to summarize a handful of them — not to draw conclusions from them.
 */
export interface AggregatedMetric {
  readonly name: MetricName;
  readonly unit?: string;
  readonly count: number;
  readonly mean: number;
  readonly median: number;
  /** Sample standard deviation (n-1); 0 when count < 2 — there is no spread to report. */
  readonly stdDev: number;
}

function median(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
}

function sampleStdDev(values: readonly number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Groups metrics by `name` and summarizes each group. Callers are responsible for only passing
 * metrics that belong to the same Task×Condition pair — this function has no way to enforce
 * that, since a `Metric` only carries a `runId`, not task/condition identity.
 */
export function aggregateMetricsByName(metrics: readonly Metric[]): AggregatedMetric[] {
  const groups = new Map<MetricName, Metric[]>();
  for (const metric of metrics) {
    const group = groups.get(metric.name);
    if (group) group.push(metric);
    else groups.set(metric.name, [metric]);
  }

  return [...groups.entries()].map(([name, group]) => {
    const values = group.map((m) => m.value).sort((a, b) => a - b);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return {
      name,
      unit: group[0]?.unit,
      count: values.length,
      mean,
      median: median(values),
      stdDev: sampleStdDev(values, mean),
    };
  });
}
