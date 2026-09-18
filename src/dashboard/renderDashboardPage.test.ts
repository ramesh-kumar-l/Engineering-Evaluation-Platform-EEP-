import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import { buildReport } from '../reporting/buildReport.js';
import type { EvaluatedRunRecord } from '../reporting/evaluatedRunInput.js';
import { renderDashboardPage } from './renderDashboardPage.js';

const EXPERIMENT_ID = 'experiment-1' as ExperimentId;

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

describe('renderDashboardPage', () => {
  it('produces one self-contained HTML document with an overview and a section per evaluation', () => {
    const graph = buildReport(
      [minimalRecord('run-1' as RunId), minimalRecord('run-2' as RunId)],
      EXPERIMENT_ID,
      { title: 'Full page' },
    );

    const html = renderDashboardPage(graph);

    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<title>Full page</title>');
    expect(html).toContain('<style>');
    expect(html).not.toContain('http://');
    expect(html).not.toContain('https://');
    expect((html.match(/class="evaluation"/g) ?? []).length).toBe(2);
  });
});
