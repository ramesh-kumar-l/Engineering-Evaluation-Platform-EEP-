import { describe, expect, it } from 'vitest';
import { extractMetricValues, metricKindFor, type RunAnalysisRecord } from './analysisInput.js';
import { buildMetric } from '../metrics/metricHelpers.js';
import { generateId } from '../domain/common/idGenerator.js';

describe('metricKindFor', () => {
  it('classifies task-success as a proportion metric', () => {
    expect(metricKindFor('task-success')).toBe('proportion');
  });

  it('classifies every other metric as continuous', () => {
    expect(metricKindFor('time-to-correct-outcome')).toBe('continuous');
    expect(metricKindFor('context-tokens')).toBe('continuous');
    expect(metricKindFor('provenance-completeness')).toBe('continuous');
  });
});

describe('extractMetricValues', () => {
  it('pulls one metric name\'s values out, in record order', () => {
    const runId = generateId<'RunId'>('run');
    const records: RunAnalysisRecord[] = [
      {
        runId,
        conditionName: 'native',
        taskCategory: 'debugging',
        taskComplexity: 'L2',
        metrics: [buildMetric(runId, 'task-success', 1), buildMetric(runId, 'tool-calls', 4)],
      },
      {
        runId,
        conditionName: 'native',
        taskCategory: 'debugging',
        taskComplexity: 'L2',
        metrics: [buildMetric(runId, 'task-success', 0)],
      },
    ];
    expect(extractMetricValues(records, 'task-success')).toEqual([1, 0]);
    expect(extractMetricValues(records, 'tool-calls')).toEqual([4]);
    expect(extractMetricValues(records, 'files-changed')).toEqual([]);
  });
});
