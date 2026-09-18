import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import { buildReport } from '../reporting/buildReport.js';
import type { EvaluatedRunRecord } from '../reporting/evaluatedRunInput.js';
import { renderOverview } from './renderOverview.js';

const EXPERIMENT_ID = 'experiment-1' as ExperimentId;

function minimalRecord(runId: RunId, status: Outcome['status']): EvaluatedRunRecord {
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
    status,
    summary: 'summary',
    verificationIds: [],
    evidenceIds: [],
    finalizedAt: '2026-09-17T00:01:00Z',
  };
  return { run, outcome, metrics: [], verifications: [], evidence: [] };
}

describe('renderOverview', () => {
  it('renders title, experiment id, evaluation count, status breakdown, and escaped limitations', () => {
    const graph = buildReport(
      [minimalRecord('run-1' as RunId, 'SUCCESS'), minimalRecord('run-2' as RunId, 'TASK_FAILURE')],
      EXPERIMENT_ID,
      { title: 'My <Report>', limitations: ['no multiple-comparisons correction applied'] },
    );

    const html = renderOverview(graph);

    expect(html).toContain('My &lt;Report&gt;');
    expect(html).toContain(EXPERIMENT_ID);
    expect(html).toContain('<dd>2</dd>');
    expect(html).toContain('SUCCESS');
    expect(html).toContain('TASK_FAILURE');
    expect(html).toContain('no multiple-comparisons correction applied');
  });

  it('renders a placeholder when there are no limitations', () => {
    const graph = buildReport([minimalRecord('run-3' as RunId, 'SUCCESS')], EXPERIMENT_ID, { title: 'No limits' });
    expect(renderOverview(graph)).toContain('No limitations recorded.');
  });
});
