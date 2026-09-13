import { describe, expect, it } from 'vitest';
import { EVALUATION_SCHEMA_VERSION, evaluationSchema } from './evaluation.schema.js';

const validEvaluation = {
  schemaVersion: EVALUATION_SCHEMA_VERSION,
  id: 'evaluation-001',
  runId: 'run-001',
  evaluatorVersion: '1.0.0',
  outcomeId: 'outcome-001',
  evaluatedAt: '2026-09-13T00:00:00Z',
};

describe('evaluationSchema', () => {
  it('accepts a valid evaluation with default empty id lists', () => {
    const parsed = evaluationSchema.parse(validEvaluation);
    expect(parsed.metricIds).toEqual([]);
    expect(parsed.verificationIds).toEqual([]);
  });

  it('accepts a correction that supersedes a prior evaluation', () => {
    const correction = { ...validEvaluation, id: 'evaluation-002', supersedesEvaluationId: 'evaluation-001' };
    expect(evaluationSchema.parse(correction).supersedesEvaluationId).toBe('evaluation-001');
  });

  it('rejects a non-semver evaluatorVersion', () => {
    expect(() => evaluationSchema.parse({ ...validEvaluation, evaluatorVersion: 'latest' })).toThrow();
  });
});
