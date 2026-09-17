import { describe, expect, it } from 'vitest';
import type { EvaluationId, ExperimentId, RunId } from '../domain/common/ids.js';
import type { Evidence } from '../domain/evidence/evidence.schema.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Trace } from '../domain/trace/trace.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { buildReport } from './buildReport.js';
import type { EvaluatedRunRecord } from './evaluatedRunInput.js';
import { BrokenReportGraphError, traceEvaluation } from './traceEvaluation.js';

const EXPERIMENT_ID = 'experiment-1' as ExperimentId;

function fullRecord(runId: RunId): EvaluatedRunRecord {
  const run: Run = {
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
  const trace: Trace = {
    schemaVersion: '1.0.0',
    id: `trace-${runId}` as Trace['id'],
    runId,
    actions: [],
    decisions: [],
    retries: 0,
    redactionApplied: false,
    startedAt: '2026-09-17T00:00:00Z',
    endedAt: '2026-09-17T00:01:00Z',
  };
  const evidence: Evidence = {
    schemaVersion: '1.0.0',
    id: `evidence-${runId}` as Evidence['id'],
    kind: 'test-result',
    description: 'test suite passed',
    source: 'npm test',
    redacted: false,
    createdAt: '2026-09-17T00:01:00Z',
  };
  const outcome: Outcome = {
    schemaVersion: '1.0.0',
    id: `outcome-${runId}` as Outcome['id'],
    runId,
    status: 'SUCCESS',
    summary: 'ok',
    verificationIds: [`verification-${runId}` as Verification['id']],
    evidenceIds: [evidence.id],
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
    evidenceIds: [evidence.id],
    timestamp: '2026-09-17T00:01:00Z',
  };
  return { run, trace, outcome, metrics: [metric], verifications: [verification], evidence: [evidence] };
}

describe('traceEvaluation', () => {
  it('drills an evaluation down to its run, trace, outcome, metrics, verifications, and evidence', () => {
    const runId = 'run-1' as RunId;
    const graph = buildReport([fullRecord(runId)], EXPERIMENT_ID, { title: 'Drill-down check' });
    const evaluationId = graph.evaluations[0]!.id;

    const drilled = traceEvaluation(graph, evaluationId);

    expect(drilled.run.id).toBe(runId);
    expect(drilled.trace?.runId).toBe(runId);
    expect(drilled.outcome.runId).toBe(runId);
    expect(drilled.metrics).toHaveLength(1);
    expect(drilled.verifications).toHaveLength(1);
    expect(drilled.evidence).toHaveLength(1);
    expect(drilled.evidence[0]?.id).toBe(`evidence-${runId}`);
  });

  it('throws for an evaluation id not present in the graph', () => {
    const graph = buildReport([fullRecord('run-2' as RunId)], EXPERIMENT_ID, { title: 'Missing id' });
    expect(() => traceEvaluation(graph, 'evaluation-does-not-exist' as EvaluationId)).toThrow(
      BrokenReportGraphError,
    );
  });
});
