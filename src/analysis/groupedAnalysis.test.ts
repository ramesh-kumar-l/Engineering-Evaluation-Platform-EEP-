import { describe, expect, it } from 'vitest';
import { analyzeRepeatedRuns } from './groupedAnalysis.js';
import type { RunAnalysisRecord } from './analysisInput.js';
import { buildMetric } from '../metrics/metricHelpers.js';
import { generateId } from '../domain/common/idGenerator.js';
import type { TaskCategory, TaskComplexity } from '../domain/task/task.schema.js';

function record(
  conditionName: string,
  category: TaskCategory,
  complexity: TaskComplexity,
  taskSuccess: 0 | 1,
): RunAnalysisRecord {
  const runId = generateId<'RunId'>('run');
  return {
    runId,
    conditionName,
    taskCategory: category,
    taskComplexity: complexity,
    metrics: [buildMetric(runId, 'task-success', taskSuccess)],
  };
}

describe('analyzeRepeatedRuns', () => {
  const records: RunAnalysisRecord[] = [
    record('native', 'debugging', 'L2', 0),
    record('native', 'debugging', 'L2', 1),
    record('native', 'feature', 'L4', 0),
    record('native', 'feature', 'L4', 0),
    record('ecc', 'debugging', 'L2', 1),
    record('ecc', 'debugging', 'L2', 1),
    record('ecc', 'feature', 'L4', 1),
    record('ecc', 'feature', 'L4', 0),
  ];

  it('produces one overall DimensionAnalysis per requested metric', () => {
    const report = analyzeRepeatedRuns(records, {
      metricNames: ['task-success'],
      baselineCondition: 'native',
      level: 0.95,
    });
    expect(report.overall).toHaveLength(1);
    expect(report.overall[0]?.dimension).toBe('overall');
    expect(report.overall[0]?.summariesByCondition).toHaveLength(2);
    expect(report.overall[0]?.comparisons).toHaveLength(1);
    expect(report.overall[0]?.comparisons[0]?.status).toBe('ok');
  });

  it('breaks results down by category', () => {
    const report = analyzeRepeatedRuns(records, {
      metricNames: ['task-success'],
      baselineCondition: 'native',
      level: 0.95,
    });
    const categories = new Set(report.byCategory.map((d) => d.dimensionValue));
    expect(categories).toEqual(new Set(['debugging', 'feature']));
  });

  it('breaks results down by complexity', () => {
    const report = analyzeRepeatedRuns(records, {
      metricNames: ['task-success'],
      baselineCondition: 'native',
      level: 0.95,
    });
    const complexities = new Set(report.byComplexity.map((d) => d.dimensionValue));
    expect(complexities).toEqual(new Set(['L2', 'L4']));
  });

  it('records which conditions were actually observed', () => {
    const report = analyzeRepeatedRuns(records, {
      metricNames: ['task-success'],
      baselineCondition: 'native',
      level: 0.95,
    });
    expect(new Set(report.conditionsObserved)).toEqual(new Set(['native', 'ecc']));
  });

  it('never crashes when only the baseline condition is present (no comparison possible)', () => {
    const baselineOnly = records.filter((r) => r.conditionName === 'native');
    const report = analyzeRepeatedRuns(baselineOnly, {
      metricNames: ['task-success'],
      baselineCondition: 'native',
      level: 0.95,
    });
    expect(report.overall[0]?.comparisons).toHaveLength(0);
    expect(report.overall[0]?.summariesByCondition).toHaveLength(1);
  });
});
