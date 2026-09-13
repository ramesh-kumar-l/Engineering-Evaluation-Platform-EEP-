import { describe, expect, it } from 'vitest';
import { METRIC_SCHEMA_VERSION, metricSchema } from './metric.schema.js';

const validMetric = {
  schemaVersion: METRIC_SCHEMA_VERSION,
  id: 'metric-001',
  runId: 'run-001',
  name: 'task-success',
  value: 1,
  computedAt: '2026-09-13T00:00:00Z',
};

describe('metricSchema', () => {
  it('accepts a primary metric', () => {
    expect(metricSchema.parse(validMetric).name).toBe('task-success');
  });

  it('accepts a secondary metric', () => {
    expect(metricSchema.parse({ ...validMetric, name: 'context-tokens', value: 4200 }).name).toBe(
      'context-tokens',
    );
  });

  it('rejects a metric name outside the defined set', () => {
    expect(() => metricSchema.parse({ ...validMetric, name: 'vibes-score' })).toThrow();
  });
});
