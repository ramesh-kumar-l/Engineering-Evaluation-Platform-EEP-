import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import { buildReport } from '../reporting/buildReport.js';
import type { EvaluatedRunRecord } from '../reporting/evaluatedRunInput.js';
import { writeReport } from '../reporting/reportWriter.js';
import { generateDashboard } from './generateDashboard.js';

function minimalRecord(experimentId: ExperimentId, runId: RunId): EvaluatedRunRecord {
  const run: Run = {
    schemaVersion: '1.0.0',
    id: runId,
    experimentId,
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

describe('generateDashboard', () => {
  it('reads a persisted report and writes a dashboard HTML file for an explicit experiment id', async () => {
    const reportsDir = await mkdtemp(join(tmpdir(), 'eep-reports-'));
    const dashboardDir = await mkdtemp(join(tmpdir(), 'eep-dash-'));
    const experimentId = 'experiment-dash-1' as ExperimentId;
    const graph = buildReport([minimalRecord(experimentId, 'run-1' as RunId)], experimentId, {
      title: 'Dashboard source report',
    });
    await writeReport(graph, reportsDir);

    const result = await generateDashboard(experimentId, { reportsDir, dashboardDir });

    expect(result.experimentId).toBe(experimentId);
    expect(result.filePath).toBe(join(dashboardDir, experimentId, 'index.html'));
    const written = await readFile(result.filePath, 'utf-8');
    expect(written).toContain('Dashboard source report');
  });

  it('resolves the most recently written report when no experiment id is given', async () => {
    const reportsDir = await mkdtemp(join(tmpdir(), 'eep-reports-'));
    const dashboardDir = await mkdtemp(join(tmpdir(), 'eep-dash-'));
    const olderId = 'experiment-older' as ExperimentId;
    const newerId = 'experiment-newer' as ExperimentId;
    await writeReport(
      buildReport([minimalRecord(olderId, 'run-1' as RunId)], olderId, { title: 'Older' }),
      reportsDir,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    await writeReport(
      buildReport([minimalRecord(newerId, 'run-1' as RunId)], newerId, { title: 'Newer' }),
      reportsDir,
    );

    const result = await generateDashboard(undefined, { reportsDir, dashboardDir });

    expect(result.experimentId).toBe(newerId);
  });
});
