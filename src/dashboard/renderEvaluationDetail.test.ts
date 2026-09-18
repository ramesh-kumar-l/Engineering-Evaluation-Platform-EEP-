import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import type { Evidence } from '../domain/evidence/evidence.schema.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { buildReport } from '../reporting/buildReport.js';
import type { EvaluatedRunRecord } from '../reporting/evaluatedRunInput.js';
import { traceEvaluation } from '../reporting/traceEvaluation.js';
import { renderEvaluationDetail } from './renderEvaluationDetail.js';

const EXPERIMENT_ID = 'experiment-1' as ExperimentId;

function fullRecord(runId: RunId, evidenceRedacted: boolean): EvaluatedRunRecord {
  const run: Run = {
    schemaVersion: '1.0.0',
    id: runId,
    experimentId: EXPERIMENT_ID,
    conditionId: 'condition-ecc' as Run['conditionId'],
    taskId: 'task-1' as Run['taskId'],
    metadata: {
      taskVersion: '1.0.0',
      repositorySha: 'abc123',
      agentName: 'llm-solving-agent',
      agentVersion: '1.0.0',
      contextProviderName: 'ecc',
      contextProviderVersion: '1.0.0',
      eepVersion: '0.1.0',
      evaluatorVersion: '0.1.0',
      benchmarkVersion: '1.0.0',
      environment: 'node-test',
    },
    startedAt: '2026-09-17T00:00:00Z',
    finishedAt: '2026-09-17T00:01:00Z',
  };
  const evidence: Evidence = {
    schemaVersion: '1.0.0',
    id: `evidence-${runId}` as Evidence['id'],
    kind: 'test-result',
    description: 'secret <details>',
    source: 'npm test',
    content: 'sensitive raw content',
    redacted: evidenceRedacted,
    createdAt: '2026-09-17T00:01:00Z',
  };
  const outcome: Outcome = {
    schemaVersion: '1.0.0',
    id: `outcome-${runId}` as Outcome['id'],
    runId,
    status: 'SUCCESS',
    summary: 'all tests passed',
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
    unit: 'ratio',
    computedAt: '2026-09-17T00:01:00Z',
  };
  const verification: Verification = {
    schemaVersion: '1.0.0',
    id: `verification-${runId}` as Verification['id'],
    runId,
    method: 'test-suite',
    passed: true,
    detail: 'all 12 tests passed',
    evidenceIds: [evidence.id],
    timestamp: '2026-09-17T00:01:00Z',
  };
  return { run, outcome, metrics: [metric], verifications: [verification], evidence: [evidence] };
}

describe('renderEvaluationDetail', () => {
  it('renders run metadata, metrics, verifications, and evidence content when not redacted', () => {
    const graph = buildReport([fullRecord('run-1' as RunId, false)], EXPERIMENT_ID, { title: 'Detail check' });
    const trace = traceEvaluation(graph, graph.evaluations[0]!.id);

    const html = renderEvaluationDetail(trace);

    expect(html).toContain('llm-solving-agent');
    expect(html).toContain('task-success');
    expect(html).toContain('test-suite');
    expect(html).toContain('sensitive raw content');
    expect(html).toContain('secret &lt;details&gt;');
    expect(html).not.toContain('[redacted]');
  });

  it('hides evidence content when redacted', () => {
    const graph = buildReport([fullRecord('run-2' as RunId, true)], EXPERIMENT_ID, { title: 'Redaction check' });
    const trace = traceEvaluation(graph, graph.evaluations[0]!.id);

    const html = renderEvaluationDetail(trace);

    expect(html).toContain('[redacted]');
    expect(html).not.toContain('sensitive raw content');
  });
});
