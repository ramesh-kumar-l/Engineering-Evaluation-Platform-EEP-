import { describe, expect, it } from 'vitest';
import type { RunId } from '../domain/common/ids.js';
import { metricSchema } from '../domain/metric/metric.schema.js';
import { buildMetric, durationMs } from './metricHelpers.js';

const runId = 'run-1' as RunId;

describe('buildMetric', () => {
  it('produces a schema-valid Metric with the given name/value/unit', () => {
    const metric = buildMetric(runId, 'task-success', 1, undefined, '2026-09-13T00:00:00.000Z');

    expect(metricSchema.safeParse(metric).success).toBe(true);
    expect(metric.runId).toBe(runId);
    expect(metric.name).toBe('task-success');
    expect(metric.value).toBe(1);
    expect(metric.unit).toBeUndefined();
    expect(metric.computedAt).toBe('2026-09-13T00:00:00.000Z');
  });

  it('carries a unit when provided', () => {
    const metric = buildMetric(runId, 'time-to-correct-outcome', 500, 'ms');
    expect(metric.unit).toBe('ms');
  });

  it('generates a unique id per call', () => {
    const a = buildMetric(runId, 'tool-calls', 1);
    const b = buildMetric(runId, 'tool-calls', 1);
    expect(a.id).not.toBe(b.id);
  });
});

describe('durationMs', () => {
  it('computes the millisecond difference between two ISO timestamps', () => {
    expect(durationMs('2026-09-13T00:00:00.000Z', '2026-09-13T00:00:01.500Z')).toBe(1500);
  });

  it('clamps to zero instead of going negative on clock skew', () => {
    expect(durationMs('2026-09-13T00:00:01.000Z', '2026-09-13T00:00:00.000Z')).toBe(0);
  });
});
