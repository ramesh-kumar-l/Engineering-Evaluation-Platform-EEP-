import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExperimentId } from '../domain/common/ids.js';
import type { ReportGraph } from './reportGraph.js';
import { defaultReportsDir, readReport, writeReport } from './reportWriter.js';

function fakeGraph(experimentId: ExperimentId): ReportGraph {
  return {
    report: {
      schemaVersion: '1.0.0',
      id: 'report-1' as ReportGraph['report']['id'],
      experimentId,
      title: 'Fake report',
      evaluationIds: ['evaluation-1' as ReportGraph['report']['evaluationIds'][number]],
      limitations: [],
      generatedAt: '2026-09-17T00:00:00Z',
    },
    evaluations: [],
    runs: [],
    traces: [],
    outcomes: [],
    metrics: [],
    verifications: [],
    evidence: [],
    contextArtifacts: [],
  };
}

describe('defaultReportsDir', () => {
  it('resolves to a "reports" directory under the current working directory', () => {
    expect(defaultReportsDir()).toBe(join(process.cwd(), 'reports'));
  });
});

describe('writeReport / readReport', () => {
  it('round-trips a ReportGraph to disk and back', async () => {
    const reportsDir = await mkdtemp(join(tmpdir(), 'eep-report-'));
    const experimentId = 'experiment-report-1' as ExperimentId;
    const graph = fakeGraph(experimentId);

    const filePath = await writeReport(graph, reportsDir);
    expect(filePath).toContain(experimentId);
    expect(filePath).toContain('report.json');

    const readBack = await readReport(experimentId, reportsDir);
    expect(readBack.report.title).toBe('Fake report');
    expect(readBack.report.experimentId).toBe(experimentId);
  });
});
