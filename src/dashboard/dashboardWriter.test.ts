import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import { buildReport } from '../reporting/buildReport.js';
import type { EvaluatedRunRecord } from '../reporting/evaluatedRunInput.js';
import { defaultDashboardDir, writeDashboard } from './dashboardWriter.js';

const EXPERIMENT_ID = 'experiment-dashboard-1' as ExperimentId;

function minimalRecord(runId: RunId): EvaluatedRunRecord {
  const run: Run = {
    schemaVersion: '1.0.0',
    id: runId,
    experimentId: EXPERIMENT_ID,
    conditionId: 'condition-native' as Run['conditionId'],
    taskId: 'task-1' as Run['taskId'],
    metadata: {
      taskVersion: '1.0.0',
      repositorySha: 'abc123',
      agentName: 'llm-solving-agent',
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
  const outcome: Outcome = {
    schemaVersion: '1.0.0',
    id: `outcome-${runId}` as Outcome['id'],
    runId,
    status: 'SUCCESS',
    summary: 'summary',
    verificationIds: [],
    evidenceIds: [],
    finalizedAt: '2026-09-17T00:01:00Z',
  };
  return { run, outcome, metrics: [], verifications: [], evidence: [] };
}

describe('defaultDashboardDir', () => {
  it('resolves to a "dashboard" directory under the current working directory', () => {
    expect(defaultDashboardDir()).toBe(join(process.cwd(), 'dashboard'));
  });
});

describe('writeDashboard', () => {
  it('writes a rendered dashboard page to <dashboardDir>/<experimentId>/index.html', async () => {
    const dashboardDir = await mkdtemp(join(tmpdir(), 'eep-dashboard-'));
    const graph = buildReport([minimalRecord('run-1' as RunId)], EXPERIMENT_ID, { title: 'Persisted dashboard' });

    const filePath = await writeDashboard(graph, dashboardDir);
    expect(filePath).toBe(join(dashboardDir, EXPERIMENT_ID, 'index.html'));

    const written = await readFile(filePath, 'utf-8');
    expect(written).toContain('Persisted dashboard');
  });
});
