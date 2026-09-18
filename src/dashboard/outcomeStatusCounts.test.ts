import { describe, expect, it } from 'vitest';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { ReportGraph } from '../reporting/reportGraph.js';
import { outcomeStatusCounts } from './outcomeStatusCounts.js';

function fakeOutcome(id: string, status: Outcome['status']): Outcome {
  return {
    schemaVersion: '1.0.0',
    id: id as Outcome['id'],
    runId: `run-${id}` as Outcome['runId'],
    status,
    summary: 'summary',
    verificationIds: [],
    evidenceIds: [],
    finalizedAt: '2026-09-17T00:00:00Z',
  };
}

function graphWithOutcomes(outcomes: Outcome[]): ReportGraph {
  return {
    report: {
      schemaVersion: '1.0.0',
      id: 'report-1' as ReportGraph['report']['id'],
      experimentId: 'experiment-1' as ReportGraph['report']['experimentId'],
      title: 'Fake',
      evaluationIds: ['evaluation-1' as ReportGraph['report']['evaluationIds'][number]],
      limitations: [],
      generatedAt: '2026-09-17T00:00:00Z',
    },
    evaluations: [],
    runs: [],
    traces: [],
    outcomes,
    metrics: [],
    verifications: [],
    evidence: [],
    contextArtifacts: [],
  };
}

describe('outcomeStatusCounts', () => {
  it('tallies outcomes by status', () => {
    const graph = graphWithOutcomes([
      fakeOutcome('outcome-1', 'SUCCESS'),
      fakeOutcome('outcome-2', 'SUCCESS'),
      fakeOutcome('outcome-3', 'TASK_FAILURE'),
    ]);

    expect(outcomeStatusCounts(graph)).toEqual({ SUCCESS: 2, TASK_FAILURE: 1 });
  });

  it('returns an empty object for a graph with no outcomes', () => {
    expect(outcomeStatusCounts(graphWithOutcomes([]))).toEqual({});
  });
});
