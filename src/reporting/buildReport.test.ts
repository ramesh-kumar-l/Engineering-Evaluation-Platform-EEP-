import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { buildReport } from './buildReport.js';
import type { EvaluatedRunRecord } from './evaluatedRunInput.js';

const EXPERIMENT_ID = 'experiment-1' as ExperimentId;

function fakeRun(runId: RunId): Run {
  return {
    schemaVersion: '1.0.0',
    id: runId,
    experimentId: EXPERIMENT_ID,
    conditionId: 'condition-native' as Run['conditionId'],
    taskId: 'task-1' as Run['taskId'],
    metadata: {
      taskVersion: '1.0.0',
      repositorySha: 'abc123',
      agentName: 'llm-solving-agent:anthropic:claude',
      agentVersion: '1.0.0',
      contextProviderName: 'native',
      contextProviderVersion: '1.0.0',
      eepVersion: '0.1.0',
      evaluatorVersion: '0.1.0',
      benchmarkVersion: '1.0.0',
      environment: 'node-test',
    },
    startedAt: '2026-09-17T00:00:00Z',
    finishedAt: '2026-09-17T00:01:00Z',
  };
}

function fakeRecord(runId: RunId): EvaluatedRunRecord {
  const outcome: Outcome = {
    schemaVersion: '1.0.0',
    id: `outcome-${runId}` as Outcome['id'],
    runId,
    status: 'SUCCESS',
    summary: 'ok',
    verificationIds: [],
    evidenceIds: [],
    finalizedAt: '2026-09-17T00:01:00Z',
  };
  const metric: Metric = {
    schemaVersion: '1.0.0',
    id: `metric-${runId}` as Metric['id'],
    runId,
    name: 'task-success',
    value: 1,
    computedAt: '2026-09-17T00:01:00Z',
  };
  const verification: Verification = {
    schemaVersion: '1.0.0',
    id: `verification-${runId}` as Verification['id'],
    runId,
    method: 'test-suite',
    passed: true,
    evidenceIds: [],
    timestamp: '2026-09-17T00:01:00Z',
  };
  return { run: fakeRun(runId), outcome, metrics: [metric], verifications: [verification], evidence: [] };
}

describe('buildReport', () => {
  it('builds one Evaluation per record and a Report referencing all of them', () => {
    const graph = buildReport(
      [fakeRecord('run-1' as RunId), fakeRecord('run-2' as RunId)],
      EXPERIMENT_ID,
      { title: 'Native vs ECC — pilot' },
    );

    expect(graph.report.experimentId).toBe(EXPERIMENT_ID);
    expect(graph.report.title).toBe('Native vs ECC — pilot');
    expect(graph.evaluations).toHaveLength(2);
    expect(graph.report.evaluationIds).toEqual(graph.evaluations.map((e) => e.id));
    expect(graph.runs).toHaveLength(2);
    expect(graph.outcomes).toHaveLength(2);
    expect(graph.metrics).toHaveLength(2);
    expect(graph.verifications).toHaveLength(2);
  });

  it('defaults limitations to an empty array and accepts caller-supplied ones', () => {
    const withoutLimitations = buildReport([fakeRecord('run-3' as RunId)], EXPERIMENT_ID, {
      title: 'Report A',
    });
    expect(withoutLimitations.report.limitations).toEqual([]);

    const withLimitations = buildReport([fakeRecord('run-4' as RunId)], EXPERIMENT_ID, {
      title: 'Report B',
      limitations: ['Only 3 of 30 benchmark tasks have real fixtures.'],
    });
    expect(withLimitations.report.limitations).toEqual([
      'Only 3 of 30 benchmark tasks have real fixtures.',
    ]);
  });

  it('deduplicates a run record that appears more than once', () => {
    const record = fakeRecord('run-5' as RunId);
    const graph = buildReport([record, record], EXPERIMENT_ID, { title: 'Duplicate check' });
    expect(graph.runs).toHaveLength(1);
    expect(graph.evaluations).toHaveLength(2);
  });

  it('throws when given zero records', () => {
    expect(() => buildReport([], EXPERIMENT_ID, { title: 'Empty' })).toThrow();
  });
});
