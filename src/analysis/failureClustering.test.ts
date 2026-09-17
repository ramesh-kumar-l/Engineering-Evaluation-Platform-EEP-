import { describe, expect, it } from 'vitest';
import { analyzeFailureClusters } from './failureClustering.js';
import type { RunVerificationRecord } from './failureAnalysisInput.js';
import { generateId } from '../domain/common/idGenerator.js';
import type { TaskCategory, TaskComplexity } from '../domain/task/task.schema.js';
import type { Verification, VerificationMethod } from '../domain/verification/verification.schema.js';

function verification(runId: string, method: VerificationMethod, passed: boolean): Verification {
  return {
    schemaVersion: '1.0.0',
    id: generateId<'VerificationId'>('verification'),
    runId: runId as never,
    method,
    passed,
    evidenceIds: [],
    timestamp: new Date().toISOString(),
  };
}

function record(
  conditionName: string,
  category: TaskCategory,
  complexity: TaskComplexity,
  results: readonly [VerificationMethod, boolean][],
): RunVerificationRecord {
  const runId = generateId<'RunId'>('run');
  return {
    runId,
    conditionName,
    taskCategory: category,
    taskComplexity: complexity,
    verifications: results.map(([method, passed]) => verification(runId, method, passed)),
  };
}

describe('analyzeFailureClusters', () => {
  const records: RunVerificationRecord[] = [
    record('native', 'debugging', 'L2', [
      ['test-suite', false],
      ['diff-analysis', true],
    ]),
    record('native', 'debugging', 'L2', [
      ['test-suite', false],
      ['diff-analysis', true],
    ]),
    record('native', 'feature', 'L4', [['test-suite', true]]),
    record('ecc', 'debugging', 'L2', [
      ['test-suite', true],
      ['diff-analysis', true],
    ]),
    record('ecc', 'feature', 'L4', [['test-suite', true]]),
  ];

  it('lists every verificationMethod actually observed', () => {
    const report = analyzeFailureClusters(records, { level: 0.95 });
    expect(report.methodsObserved).toEqual(['diff-analysis', 'test-suite']);
  });

  it('computes overall failure rate per method across all conditions/tasks', () => {
    const report = analyzeFailureClusters(records, { level: 0.95 });
    const testSuite = report.overall.find((s) => s.method === 'test-suite');
    expect(testSuite?.totalAttempts).toBe(5);
    expect(testSuite?.failureCount).toBe(2);
    expect(testSuite?.failureRate).toBeCloseTo(0.4);
    const diffAnalysis = report.overall.find((s) => s.method === 'diff-analysis');
    expect(diffAnalysis?.failureCount).toBe(0);
  });

  it('sorts the overall list worst-failure-rate first', () => {
    const report = analyzeFailureClusters(records, { level: 0.95 });
    expect(report.overall[0]?.method).toBe('test-suite');
    expect(report.overall[0]?.failureRate).toBeGreaterThanOrEqual(report.overall[1]?.failureRate ?? 0);
  });

  it('clusters by condition, isolating that test-suite fails only under native', () => {
    const report = analyzeFailureClusters(records, { level: 0.95 });
    const nativeTestSuite = report.byCondition.find((s) => s.method === 'test-suite' && s.dimensionValue === 'native');
    const eccTestSuite = report.byCondition.find((s) => s.method === 'test-suite' && s.dimensionValue === 'ecc');
    expect(nativeTestSuite?.failureRate).toBeCloseTo(2 / 3);
    expect(eccTestSuite?.failureRate).toBe(0);
  });

  it('clusters by task category', () => {
    const report = analyzeFailureClusters(records, { level: 0.95 });
    const debuggingTestSuite = report.byCategory.find(
      (s) => s.method === 'test-suite' && s.dimensionValue === 'debugging',
    );
    expect(debuggingTestSuite?.totalAttempts).toBe(3);
    expect(debuggingTestSuite?.failureCount).toBe(2);
  });

  it('clusters by task complexity', () => {
    const report = analyzeFailureClusters(records, { level: 0.95 });
    const l2TestSuite = report.byComplexity.find((s) => s.method === 'test-suite' && s.dimensionValue === 'L2');
    expect(l2TestSuite?.totalAttempts).toBe(3);
    expect(l2TestSuite?.failureCount).toBe(2);
  });

  it('attaches a Wilson confidence interval to every cluster', () => {
    const report = analyzeFailureClusters(records, { level: 0.95 });
    for (const summary of [...report.overall, ...report.byCondition, ...report.byCategory, ...report.byComplexity]) {
      expect(summary.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
      expect(summary.confidenceInterval.upper).toBeLessThanOrEqual(1);
      expect(summary.confidenceInterval.level).toBe(0.95);
    }
  });

  it('returns empty results for no records rather than throwing', () => {
    const report = analyzeFailureClusters([], { level: 0.95 });
    expect(report.methodsObserved).toEqual([]);
    expect(report.overall).toEqual([]);
    expect(report.byCondition).toEqual([]);
  });
});
