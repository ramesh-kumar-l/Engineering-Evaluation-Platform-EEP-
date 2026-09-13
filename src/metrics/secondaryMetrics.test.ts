import { describe, expect, it } from 'vitest';
import type { Action } from '../domain/trace/action.schema.js';
import type { Decision } from '../domain/trace/decision.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { computeSecondaryMetrics } from './secondaryMetrics.js';
import { buildTestInput } from './testSupport.js';

function metricValue(metrics: ReturnType<typeof computeSecondaryMetrics>, name: string): number {
  const metric = metrics.find((m) => m.name === name);
  if (!metric) throw new Error(`metric ${name} not found`);
  return metric.value;
}

function action(type: Action['type'], target: string): Action {
  return {
    schemaVersion: '1.0.0',
    id: `action-${target}-${type}` as Action['id'],
    runId: 'run-metrics-test' as Action['runId'],
    type,
    target,
    timestamp: '2026-09-13T00:00:01.000Z',
  };
}

const decision: Decision = {
  schemaVersion: '1.0.0',
  id: 'decision-1' as Decision['id'],
  runId: 'run-metrics-test' as Decision['runId'],
  description: 'test decision',
  alternativesConsidered: [],
  timestamp: '2026-09-13T00:00:01.000Z',
};

describe('computeSecondaryMetrics', () => {
  it('tool-calls counts every recorded action; agent-turns counts every decision', () => {
    const base = buildTestInput();
    const metrics = computeSecondaryMetrics({
      ...base,
      trace: {
        ...base.trace,
        actions: [action('file-read', 'a.ts'), action('file-read', 'b.ts')],
        decisions: [decision],
      },
    });
    expect(metricValue(metrics, 'tool-calls')).toBe(2);
    expect(metricValue(metrics, 'agent-turns')).toBe(1);
  });

  it('files-read and files-changed count distinct targets by action type', () => {
    const base = buildTestInput();
    const metrics = computeSecondaryMetrics({
      ...base,
      trace: {
        ...base.trace,
        actions: [
          action('file-read', 'a.ts'),
          action('file-read', 'a.ts'),
          action('file-edit', 'b.ts'),
          action('file-create', 'c.ts'),
        ],
      },
    });
    expect(metricValue(metrics, 'files-read')).toBe(1);
    expect(metricValue(metrics, 'files-changed')).toBe(2);
  });

  it('retries passes through Trace.retries', () => {
    const base = buildTestInput();
    const metrics = computeSecondaryMetrics({ ...base, trace: { ...base.trace, retries: 3 } });
    expect(metricValue(metrics, 'retries')).toBe(3);
  });

  it('failed-attempts counts verifications that did not pass', () => {
    const verification: Verification = {
      schemaVersion: '1.0.0',
      id: 'verification-1' as Verification['id'],
      runId: 'run-metrics-test' as Verification['runId'],
      method: 'test-suite',
      passed: false,
      evidenceIds: [],
      timestamp: '2026-09-13T00:00:01.000Z',
    };
    const metrics = computeSecondaryMetrics(buildTestInput({ verifications: [verification] }));
    expect(metricValue(metrics, 'failed-attempts')).toBe(1);
  });

  it('provenance-completeness is the fraction of verifications carrying evidence', () => {
    const withEvidence: Verification = {
      schemaVersion: '1.0.0',
      id: 'verification-1' as Verification['id'],
      runId: 'run-metrics-test' as Verification['runId'],
      method: 'test-suite',
      passed: true,
      evidenceIds: ['evidence-1' as Verification['evidenceIds'][number]],
      timestamp: '2026-09-13T00:00:01.000Z',
    };
    const withoutEvidence: Verification = { ...withEvidence, id: 'verification-2' as Verification['id'], evidenceIds: [] };

    const metrics = computeSecondaryMetrics(
      buildTestInput({ verifications: [withEvidence, withoutEvidence] }),
    );
    expect(metricValue(metrics, 'provenance-completeness')).toBe(0.5);
  });

  it('verification-completeness accounts for verifiers that could not execute at all', () => {
    const verification: Verification = {
      schemaVersion: '1.0.0',
      id: 'verification-1' as Verification['id'],
      runId: 'run-metrics-test' as Verification['runId'],
      method: 'test-suite',
      passed: true,
      evidenceIds: [],
      timestamp: '2026-09-13T00:00:01.000Z',
    };

    const metrics = computeSecondaryMetrics(
      buildTestInput({
        verifications: [verification],
        executionErrors: [{ method: 'diff-analysis', error: new Error('boom') }],
      }),
    );
    expect(metricValue(metrics, 'verification-completeness')).toBe(0.5);
  });

  it('verification-completeness is 0 when nothing was attempted at all', () => {
    const metrics = computeSecondaryMetrics(buildTestInput());
    expect(metricValue(metrics, 'verification-completeness')).toBe(0);
  });
});
