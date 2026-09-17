import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import { readReport } from '../reporting/reportWriter.js';
import { generateReport } from './generateReport.js';
import { writeRunResult, type RunResultBundle } from './resultsWriter.js';

function bundleFor(runId: RunId, experimentId: ExperimentId): RunResultBundle {
  return {
    conditionName: 'native',
    taskId: 'debugging-01',
    taskCategory: 'debugging',
    taskComplexity: 'L1',
    run: {
      schemaVersion: '1.0.0',
      id: runId,
      experimentId,
      conditionId: 'condition-native' as RunResultBundle['run']['conditionId'],
      taskId: 'task-1' as RunResultBundle['run']['taskId'],
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
    },
    trace: {
      schemaVersion: '1.0.0',
      id: `trace-${runId}` as RunResultBundle['trace']['id'],
      runId,
      actions: [],
      decisions: [],
      retries: 0,
      redactionApplied: false,
      startedAt: '2026-09-17T00:00:00Z',
      endedAt: '2026-09-17T00:01:00Z',
    },
    outcome: {
      schemaVersion: '1.0.0',
      id: `outcome-${runId}` as RunResultBundle['outcome']['id'],
      runId,
      status: 'SUCCESS',
      summary: 'ok',
      verificationIds: [],
      evidenceIds: [],
      finalizedAt: '2026-09-17T00:01:00Z',
    },
    verifications: [],
    evidence: [],
    metrics: [
      {
        schemaVersion: '1.0.0',
        id: `metric-${runId}` as RunResultBundle['metrics'][number]['id'],
        runId,
        name: 'task-success',
        value: 1,
        computedAt: '2026-09-17T00:01:00Z',
      },
    ],
  };
}

/**
 * End-to-end wiring check using synthetic bundles (no live LLM/ECC call, same precedent as
 * analyzeComparisonResults.test.ts). Proves `generateReport` reads raw dumped bundles back,
 * builds a canonical `ReportGraph`, and persists it to `reports/<experimentId>/report.json`.
 */
describe('generateReport', () => {
  it('reads dumped bundles, builds a Report, and writes it to the canonical reports directory', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-genreport-results-'));
    const reportsDir = await mkdtemp(join(tmpdir(), 'eep-genreport-out-'));
    const experimentId = 'experiment-genreport-1' as ExperimentId;

    await writeRunResult(bundleFor('run-1' as RunId, experimentId), experimentId, 'run-1' as RunId, resultsDir);
    await writeRunResult(bundleFor('run-2' as RunId, experimentId), experimentId, 'run-2' as RunId, resultsDir);

    const { filePath, graph } = await generateReport(experimentId, { resultsDir, reportsDir });

    expect(filePath).toContain('report.json');
    expect(graph.report.experimentId).toBe(experimentId);
    expect(graph.evaluations).toHaveLength(2);
    expect(graph.runs).toHaveLength(2);

    const readBack = await readReport(experimentId, reportsDir);
    expect(readBack.report.id).toBe(graph.report.id);
    expect(readBack.evaluations).toHaveLength(2);
  });

  it('resolves the most recently written experiment when no experimentId is given', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-genreport-latest-'));
    const reportsDir = await mkdtemp(join(tmpdir(), 'eep-genreport-latest-out-'));
    const experimentId = 'experiment-genreport-latest' as ExperimentId;
    await writeRunResult(bundleFor('run-1' as RunId, experimentId), experimentId, 'run-1' as RunId, resultsDir);

    const { graph } = await generateReport(undefined, { resultsDir, reportsDir });
    expect(graph.report.experimentId).toBe(experimentId);
  });

  it('throws when no run results exist for the requested experiment', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-genreport-empty-'));
    await expect(
      generateReport('experiment-missing' as ExperimentId, { resultsDir }),
    ).rejects.toThrow();
  });
});
