import { describe, expect, it } from 'vitest';
import { analyzeComponentContributions } from './componentContribution.js';
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

function continuousRecord(conditionName: string, timeToCorrectMs: number): RunAnalysisRecord {
  const runId = generateId<'RunId'>('run');
  return {
    runId,
    conditionName,
    taskCategory: 'debugging',
    taskComplexity: 'L2',
    metrics: [buildMetric(runId, 'time-to-correct-outcome', timeToCorrectMs)],
  };
}

describe('analyzeComponentContributions', () => {
  const records: RunAnalysisRecord[] = [
    record('ecc', 'debugging', 'L2', 1),
    record('ecc', 'debugging', 'L2', 1),
    record('ecc', 'feature', 'L4', 1),
    record('ecc', 'feature', 'L4', 0),
    record('ecc-ablated:history', 'debugging', 'L2', 0),
    record('ecc-ablated:history', 'debugging', 'L2', 1),
    record('ecc-ablated:history', 'feature', 'L4', 0),
    record('ecc-ablated:history', 'feature', 'L4', 0),
    record('ecc-ablated:risk', 'debugging', 'L2', 1),
  ];

  const options = {
    fullConditionName: 'ecc',
    ablatedConditionsByComponent: { history: 'ecc-ablated:history', risk: 'ecc-ablated:risk' },
    metricNames: ['task-success'] as const,
    level: 0.95 as const,
  };

  it('returns one contribution entry per requested component', () => {
    const contributions = analyzeComponentContributions(records, options);
    expect(contributions.map((c) => c.component).sort()).toEqual(['history', 'risk']);
  });

  it('scopes each component analysis to only the full and that component\'s ablated condition', () => {
    const contributions = analyzeComponentContributions(records, options);
    const historyEntry = contributions.find((c) => c.component === 'history');
    expect(new Set(historyEntry?.analysis.conditionsObserved)).toEqual(
      new Set(['ecc', 'ecc-ablated:history']),
    );
  });

  it('uses the full condition as the baseline and reuses Phase 7 analysis unchanged', () => {
    const contributions = analyzeComponentContributions(records, options);
    const historyEntry = contributions.find((c) => c.component === 'history');
    expect(historyEntry?.analysis.baselineCondition).toBe('ecc');
    expect(historyEntry?.analysis.overall[0]?.comparisons[0]?.status).toBe('ok');
  });

  it('reports insufficient-data rather than crashing when a component has too few ablated runs', () => {
    const sparseRecords: RunAnalysisRecord[] = [
      continuousRecord('ecc', 100),
      continuousRecord('ecc', 120),
      continuousRecord('ecc-ablated:risk', 90),
    ];
    const contributions = analyzeComponentContributions(sparseRecords, {
      fullConditionName: 'ecc',
      ablatedConditionsByComponent: { risk: 'ecc-ablated:risk' },
      metricNames: ['time-to-correct-outcome'],
      level: 0.95,
    });
    const riskEntry = contributions.find((c) => c.component === 'risk');
    expect(riskEntry?.analysis.overall[0]?.comparisons[0]?.status).toBe('insufficient-data');
  });

  it('breaks each component\'s analysis down by category and complexity same as Phase 7', () => {
    const contributions = analyzeComponentContributions(records, options);
    const historyEntry = contributions.find((c) => c.component === 'history');
    expect(historyEntry?.analysis.byCategory.length).toBeGreaterThan(0);
    expect(historyEntry?.analysis.byComplexity.length).toBeGreaterThan(0);
  });
});
