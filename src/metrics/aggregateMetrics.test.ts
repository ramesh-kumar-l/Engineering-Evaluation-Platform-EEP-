import { describe, expect, it } from 'vitest';
import type { RunId } from '../domain/common/ids.js';
import { buildMetric } from './metricHelpers.js';
import { aggregateMetricsByName } from './aggregateMetrics.js';

describe('aggregateMetricsByName', () => {
  it('groups by metric name and computes mean/median/stdDev', () => {
    const metrics = [
      buildMetric('run-1' as RunId, 'task-success', 1),
      buildMetric('run-2' as RunId, 'task-success', 0),
      buildMetric('run-3' as RunId, 'task-success', 1),
    ];

    const [aggregated] = aggregateMetricsByName(metrics);

    expect(aggregated?.name).toBe('task-success');
    expect(aggregated?.count).toBe(3);
    expect(aggregated?.mean).toBeCloseTo(0.6667, 3);
    expect(aggregated?.median).toBe(1);
    expect(aggregated?.stdDev).toBeGreaterThan(0);
  });

  it('keeps metric names in separate groups', () => {
    const metrics = [
      buildMetric('run-1' as RunId, 'task-success', 1),
      buildMetric('run-1' as RunId, 'tool-calls', 5),
    ];

    const aggregated = aggregateMetricsByName(metrics);
    expect(aggregated).toHaveLength(2);
  });

  it('reports stdDev of 0 for a single-value group', () => {
    const [aggregated] = aggregateMetricsByName([buildMetric('run-1' as RunId, 'tool-calls', 5)]);
    expect(aggregated?.stdDev).toBe(0);
    expect(aggregated?.mean).toBe(5);
    expect(aggregated?.median).toBe(5);
  });

  it('carries the unit through from the source metrics', () => {
    const [aggregated] = aggregateMetricsByName([
      buildMetric('run-1' as RunId, 'time-to-correct-outcome', 500, 'ms'),
    ]);
    expect(aggregated?.unit).toBe('ms');
  });
});
