import { describe, expect, it } from 'vitest';
import type { ContextArtifact } from '../domain/evidence/context-artifact.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { computePrimaryMetrics } from './primaryMetrics.js';
import { buildTestInput } from './testSupport.js';

function metricValue(metrics: ReturnType<typeof computePrimaryMetrics>, name: string): number {
  const metric = metrics.find((m) => m.name === name);
  if (!metric) throw new Error(`metric ${name} not found`);
  return metric.value;
}

const passingVerification: Verification = {
  schemaVersion: '1.0.0',
  id: 'verification-1' as Verification['id'],
  runId: 'run-metrics-test' as Verification['runId'],
  method: 'test-suite',
  passed: true,
  evidenceIds: [],
  timestamp: '2026-09-13T00:00:01.000Z',
};

const failingVerification: Verification = { ...passingVerification, passed: false, method: 'diff-analysis' };

describe('computePrimaryMetrics', () => {
  it('produces exactly the five primary metric names', () => {
    const metrics = computePrimaryMetrics(buildTestInput());
    expect(metrics.map((m) => m.name).sort()).toEqual(
      [
        'task-success',
        'engineering-quality',
        'time-to-correct-outcome',
        'context-efficiency',
        'human-intervention',
      ].sort(),
    );
  });

  it('task-success is 1 only when Outcome.status is SUCCESS', () => {
    const success = computePrimaryMetrics(
      buildTestInput({ outcome: { ...buildTestInput().outcome, status: 'SUCCESS' } }),
    );
    expect(metricValue(success, 'task-success')).toBe(1);

    const failure = computePrimaryMetrics(buildTestInput());
    expect(metricValue(failure, 'task-success')).toBe(0);
  });

  it('engineering-quality is the fraction of verifications that passed', () => {
    const metrics = computePrimaryMetrics(
      buildTestInput({ verifications: [passingVerification, failingVerification] }),
    );
    expect(metricValue(metrics, 'engineering-quality')).toBe(0.5);
  });

  it('engineering-quality is 0 when there are no verifications at all', () => {
    const metrics = computePrimaryMetrics(buildTestInput({ verifications: [] }));
    expect(metricValue(metrics, 'engineering-quality')).toBe(0);
  });

  it('time-to-correct-outcome measures Run.startedAt to Run.finishedAt in ms', () => {
    const metrics = computePrimaryMetrics(buildTestInput());
    expect(metricValue(metrics, 'time-to-correct-outcome')).toBe(2000);
  });

  it('context-efficiency is 0 with no context artifact', () => {
    const metrics = computePrimaryMetrics(buildTestInput());
    expect(metricValue(metrics, 'context-efficiency')).toBe(0);
  });

  it('context-efficiency rewards success at lower token cost', () => {
    const contextArtifact: ContextArtifact = {
      schemaVersion: '1.0.0',
      id: 'ctxart-1' as ContextArtifact['id'],
      runId: 'run-metrics-test' as ContextArtifact['runId'],
      providerName: 'native',
      providerVersion: '1.0.0',
      content: 'x'.repeat(4000),
      tokenCount: 1000,
      redacted: false,
      createdAt: '2026-09-13T00:00:00.000Z',
    };

    const base = buildTestInput({ contextArtifact });
    const successful = computePrimaryMetrics({ ...base, outcome: { ...base.outcome, status: 'SUCCESS' } });
    const failed = computePrimaryMetrics(base);

    expect(metricValue(successful, 'context-efficiency')).toBe(1);
    expect(metricValue(failed, 'context-efficiency')).toBe(0);
  });

  it('human-intervention is always 0 (no human-in-the-loop mechanism exists yet)', () => {
    const metrics = computePrimaryMetrics(buildTestInput());
    expect(metricValue(metrics, 'human-intervention')).toBe(0);
  });
});
