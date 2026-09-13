import { generateId } from '../domain/common/idGenerator.js';
import type { RunId } from '../domain/common/ids.js';
import { metricSchema, type Metric, type MetricName } from '../domain/metric/metric.schema.js';

/** Constructs and validates one Metric record — the only place a Metric is instantiated. */
export function buildMetric(
  runId: RunId,
  name: MetricName,
  value: number,
  unit?: string,
  computedAt: string = new Date().toISOString(),
): Metric {
  return metricSchema.parse({
    schemaVersion: '1.0.0',
    id: generateId<'MetricId'>('metric'),
    runId,
    name,
    value,
    unit,
    computedAt,
  });
}

/** Milliseconds between two ISO timestamps; clamped to zero so clock skew can't go negative. */
export function durationMs(startedAt: string, endedAt: string): number {
  return Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime());
}
