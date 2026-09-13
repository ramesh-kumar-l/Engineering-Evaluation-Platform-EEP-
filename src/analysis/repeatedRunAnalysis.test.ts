import { describe, expect, it } from 'vitest';
import { compareConditions, summarizeGroup } from './repeatedRunAnalysis.js';
import type { RunAnalysisRecord } from './analysisInput.js';
import { buildMetric } from '../metrics/metricHelpers.js';
import { generateId } from '../domain/common/idGenerator.js';
import type { TaskCategory, TaskComplexity } from '../domain/task/task.schema.js';

function record(
  conditionName: string,
  timeToCorrectOutcomeMs: number,
  taskSuccess: 0 | 1,
  category: TaskCategory = 'debugging',
  complexity: TaskComplexity = 'L2',
): RunAnalysisRecord {
  const runId = generateId<'RunId'>('run');
  return {
    runId,
    conditionName,
    taskCategory: category,
    taskComplexity: complexity,
    metrics: [
      buildMetric(runId, 'time-to-correct-outcome', timeToCorrectOutcomeMs, 'ms'),
      buildMetric(runId, 'task-success', taskSuccess),
    ],
  };
}

describe('summarizeGroup', () => {
  it('summarizes a continuous metric with a Student-t confidence interval', () => {
    const records = [
      record('native', 100, 1),
      record('native', 120, 0),
      record('native', 110, 1),
    ];
    const summary = summarizeGroup(records, 'native', 'time-to-correct-outcome', 0.95);
    expect(summary.status).toBe('ok');
    if (summary.status !== 'ok') throw new Error('unreachable');
    expect(summary.n).toBe(3);
    expect(summary.mean).toBeCloseTo(110, 6);
    expect(summary.confidenceInterval.level).toBe(0.95);
  });

  it('summarizes task-success with a Wilson confidence interval', () => {
    const records = [record('native', 100, 1), record('native', 100, 1), record('native', 100, 0)];
    const summary = summarizeGroup(records, 'native', 'task-success', 0.95);
    expect(summary.status).toBe('ok');
    if (summary.status !== 'ok') throw new Error('unreachable');
    expect(summary.mean).toBeCloseTo(2 / 3, 6);
    expect(summary.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
    expect(summary.confidenceInterval.upper).toBeLessThanOrEqual(1);
  });

  it('reports insufficient-data for a continuous metric with fewer than 2 runs, without throwing', () => {
    const summary = summarizeGroup([record('native', 100, 1)], 'native', 'time-to-correct-outcome', 0.95);
    expect(summary.status).toBe('insufficient-data');
    if (summary.status !== 'insufficient-data') throw new Error('unreachable');
    expect(summary.n).toBe(1);
  });

  it('reports insufficient-data when the condition has no matching runs at all', () => {
    const summary = summarizeGroup([record('native', 100, 1)], 'ecc', 'time-to-correct-outcome', 0.95);
    expect(summary.status).toBe('insufficient-data');
    expect(summary.n).toBe(0);
  });
});

describe('compareConditions', () => {
  it('computes a signed effect size between baseline and treatment for a continuous metric', () => {
    const records = [
      record('native', 200, 0),
      record('native', 220, 0),
      record('native', 210, 1),
      record('ecc', 100, 1),
      record('ecc', 110, 1),
      record('ecc', 90, 1),
    ];
    const comparison = compareConditions(records, 'native', 'ecc', 'time-to-correct-outcome', 0.95);
    expect(comparison.status).toBe('ok');
    if (comparison.status !== 'ok') throw new Error('unreachable');
    expect(comparison.meanDifference).toBeLessThan(0); // ecc is faster (lower ms) than native
    expect(comparison.effectSize.measure).toBe('cohens-d');
  });

  it('uses cohens-h for the proportion metric task-success', () => {
    const records = [
      record('native', 200, 0),
      record('native', 200, 1),
      record('ecc', 100, 1),
      record('ecc', 100, 1),
    ];
    const comparison = compareConditions(records, 'native', 'ecc', 'task-success', 0.95);
    expect(comparison.status).toBe('ok');
    if (comparison.status !== 'ok') throw new Error('unreachable');
    expect(comparison.effectSize.measure).toBe('cohens-h');
  });

  it('reports insufficient-data (not a throw) when one side lacks enough runs', () => {
    const records = [record('native', 200, 0), record('ecc', 100, 1)];
    const comparison = compareConditions(records, 'native', 'ecc', 'time-to-correct-outcome', 0.95);
    expect(comparison.status).toBe('insufficient-data');
  });
});
