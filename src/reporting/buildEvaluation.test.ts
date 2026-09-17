import { describe, expect, it } from 'vitest';
import type { RunId } from '../domain/common/ids.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { buildEvaluation } from './buildEvaluation.js';
import type { EvaluatedRunRecord } from './evaluatedRunInput.js';

function fakeRun(runId: RunId): Run {
  return {
    schemaVersion: '1.0.0',
    id: runId,
    experimentId: 'experiment-1' as Run['experimentId'],
    conditionId: 'condition-1' as Run['conditionId'],
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

function fakeOutcome(runId: RunId): Outcome {
  return {
    schemaVersion: '1.0.0',
    id: `outcome-${runId}` as Outcome['id'],
    runId,
    status: 'SUCCESS',
    summary: 'ok',
    verificationIds: [],
    evidenceIds: [],
    finalizedAt: '2026-09-17T00:01:00Z',
  };
}

function fakeMetric(runId: RunId): Metric {
  return {
    schemaVersion: '1.0.0',
    id: `metric-${runId}` as Metric['id'],
    runId,
    name: 'task-success',
    value: 1,
    computedAt: '2026-09-17T00:01:00Z',
  };
}

function fakeVerification(runId: RunId): Verification {
  return {
    schemaVersion: '1.0.0',
    id: `verification-${runId}` as Verification['id'],
    runId,
    method: 'test-suite',
    passed: true,
    evidenceIds: [],
    timestamp: '2026-09-17T00:01:00Z',
  };
}

function fakeRecord(runId: RunId): EvaluatedRunRecord {
  return {
    run: fakeRun(runId),
    outcome: fakeOutcome(runId),
    metrics: [fakeMetric(runId)],
    verifications: [fakeVerification(runId)],
    evidence: [],
  };
}

describe('buildEvaluation', () => {
  it('builds a schema-valid Evaluation linking runId/outcomeId/metricIds/verificationIds', () => {
    const runId = 'run-1' as RunId;
    const evaluation = buildEvaluation(fakeRecord(runId), '2026-09-17T00:02:00Z');

    expect(evaluation.runId).toBe(runId);
    expect(evaluation.outcomeId).toBe(`outcome-${runId}`);
    expect(evaluation.metricIds).toEqual([`metric-${runId}`]);
    expect(evaluation.verificationIds).toEqual([`verification-${runId}`]);
    expect(evaluation.evaluatedAt).toBe('2026-09-17T00:02:00Z');
  });

  it('reads evaluatorVersion from the run\'s own recorded metadata, not a separate parameter', () => {
    const runId = 'run-2' as RunId;
    const record = fakeRecord(runId);
    const evaluation = buildEvaluation(record);
    expect(evaluation.evaluatorVersion).toBe(record.run.metadata.evaluatorVersion);
  });

  it('generates a fresh, unique id per call', () => {
    const runId = 'run-3' as RunId;
    const a = buildEvaluation(fakeRecord(runId));
    const b = buildEvaluation(fakeRecord(runId));
    expect(a.id).not.toBe(b.id);
  });
});
