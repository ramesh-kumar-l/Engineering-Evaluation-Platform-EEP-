import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { analyzeComparisonResults } from './analyzeComparisonResults.js';
import { writeRunResult, type RunResultBundle } from './resultsWriter.js';

function successMetric(runId: RunId, value: number): Metric {
  return {
    schemaVersion: '1.0.0',
    id: `metric-${runId}` as Metric['id'],
    runId,
    name: 'task-success',
    value,
    computedAt: '2026-09-13T00:00:00Z',
  };
}

function testSuiteVerification(runId: RunId, passed: boolean): Verification {
  return {
    schemaVersion: '1.0.0',
    id: `verification-${runId}` as Verification['id'],
    runId,
    method: 'test-suite',
    passed,
    evidenceIds: [],
    timestamp: '2026-09-13T00:00:00Z',
  };
}

function bundleFor(conditionName: string, runId: RunId, value: number): RunResultBundle {
  return {
    conditionName,
    taskId: 'debugging-01',
    taskCategory: 'debugging',
    taskComplexity: 'L1',
    run: { id: runId } as unknown as RunResultBundle['run'],
    trace: { id: `trace-${runId}` } as unknown as RunResultBundle['trace'],
    outcome: { id: `outcome-${runId}`, status: value === 1 ? 'SUCCESS' : 'TASK_FAILURE' } as unknown as RunResultBundle['outcome'],
    verifications: [testSuiteVerification(runId, value === 1)],
    evidence: [],
    metrics: [successMetric(runId, value)],
  };
}

/**
 * End-to-end wiring check using synthetic bundles (no live LLM/ECC call — those are gated behind
 * real credentials/checkouts, per project-memory-bank/16-risks.md and the eccContextProvider
 * "real CLI" test's precedent). Proves `analyzeComparisonResults` correctly reconstructs
 * `RunAnalysisRecord[]` from dumped bundles and drives Phase 7/8's analysis functions unchanged.
 */
describe('analyzeComparisonResults', () => {
  it('reconstructs analysis records from dumped bundles and reports native/ecc plus every ablation component', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-analyze-'));
    const experimentId = 'experiment-analyze-1' as ExperimentId;

    await writeRunResult(bundleFor('native', 'run-n1' as RunId, 0), experimentId, 'run-n1' as RunId, resultsDir);
    await writeRunResult(bundleFor('native', 'run-n2' as RunId, 0), experimentId, 'run-n2' as RunId, resultsDir);
    await writeRunResult(bundleFor('ecc', 'run-e1' as RunId, 1), experimentId, 'run-e1' as RunId, resultsDir);
    await writeRunResult(bundleFor('ecc', 'run-e2' as RunId, 1), experimentId, 'run-e2' as RunId, resultsDir);
    await writeRunResult(
      bundleFor('ecc-ablated:history', 'run-h1' as RunId, 0),
      experimentId,
      'run-h1' as RunId,
      resultsDir,
    );

    const result = await analyzeComparisonResults(experimentId, resultsDir, ['task-success'], 0.95);

    expect(result.runCount).toBe(5);
    expect(result.repeatedRunReport.conditionsObserved).toEqual(
      expect.arrayContaining(['native', 'ecc', 'ecc-ablated:history']),
    );
    expect(result.componentReports).toHaveLength(7);

    const historyContribution = result.componentReports.find((c) => c.component === 'history');
    expect(historyContribution?.analysis.conditionsObserved).toEqual(
      expect.arrayContaining(['ecc', 'ecc-ablated:history']),
    );

    expect(result.failureClusterReport.methodsObserved).toEqual(['test-suite']);
    const overall = result.failureClusterReport.overall[0];
    expect(overall?.method).toBe('test-suite');
    expect(overall?.totalAttempts).toBe(5);
    expect(overall?.failureCount).toBe(3);
    const nativeCluster = result.failureClusterReport.byCondition.find((s) => s.dimensionValue === 'native');
    expect(nativeCluster?.failureRate).toBe(1);
    const eccCluster = result.failureClusterReport.byCondition.find((s) => s.dimensionValue === 'ecc');
    expect(eccCluster?.failureRate).toBe(0);
  });

  it('resolves the most recently written experiment when no experimentId is given', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-analyze-latest-'));
    const experimentId = 'experiment-analyze-latest' as ExperimentId;
    await writeRunResult(bundleFor('native', 'run-1' as RunId, 1), experimentId, 'run-1' as RunId, resultsDir);

    const result = await analyzeComparisonResults(undefined, resultsDir, ['task-success'], 0.95);
    expect(result.experimentId).toBe(experimentId);
  });

  it('throws when no run results exist for the requested experiment', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-analyze-empty-'));
    await expect(
      analyzeComparisonResults('experiment-missing' as ExperimentId, resultsDir),
    ).rejects.toThrow();
  });
});
