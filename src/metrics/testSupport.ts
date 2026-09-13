import type { RunId } from '../domain/common/ids.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Trace } from '../domain/trace/trace.schema.js';
import type { RunMetricsInput } from './metricsInput.js';

/**
 * Minimal, schema-shaped fixture builder shared by primaryMetrics.test.ts and
 * secondaryMetrics.test.ts — test-only, not exported from index.ts.
 */
export function buildTestInput(overrides: Partial<RunMetricsInput> = {}): RunMetricsInput {
  const runId = 'run-metrics-test' as RunId;

  const run: Run = {
    schemaVersion: '1.0.0',
    id: runId,
    experimentId: 'experiment-1' as Run['experimentId'],
    conditionId: 'condition-1' as Run['conditionId'],
    taskId: 'task-1' as Run['taskId'],
    metadata: {
      taskVersion: '1.0.0',
      repositorySha: 'deadbeef',
      agentName: 'native',
      agentVersion: '1.0.0',
      contextProviderName: 'native',
      contextProviderVersion: '1.0.0',
      eepVersion: '0.1.0',
      evaluatorVersion: '0.1.0',
      benchmarkVersion: '1.0.0',
      environment: 'vitest',
    },
    startedAt: '2026-09-13T00:00:00.000Z',
    finishedAt: '2026-09-13T00:00:02.000Z',
  };

  const trace: Trace = {
    schemaVersion: '1.0.0',
    id: 'trace-1' as Trace['id'],
    runId,
    actions: [],
    decisions: [],
    retries: 0,
    redactionApplied: false,
    startedAt: '2026-09-13T00:00:00.000Z',
    endedAt: '2026-09-13T00:00:02.000Z',
  };

  const outcome: Outcome = {
    schemaVersion: '1.0.0',
    id: 'outcome-1' as Outcome['id'],
    runId,
    status: 'TASK_FAILURE',
    summary: 'test fixture',
    verificationIds: [],
    evidenceIds: [],
    finalizedAt: '2026-09-13T00:00:02.000Z',
  };

  return {
    run,
    trace,
    outcome,
    verifications: [],
    evidence: [],
    executionErrors: [],
    ...overrides,
  };
}
