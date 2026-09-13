import { describe, expect, it } from 'vitest';
import { DECISION_SCHEMA_VERSION, decisionSchema } from './decision.schema.js';

const validDecision = {
  schemaVersion: DECISION_SCHEMA_VERSION,
  id: 'decision-001',
  runId: 'run-001',
  description: 'Chose to fix the boundary condition rather than rewrite the paginator.',
  timestamp: '2026-09-13T00:00:00Z',
};

describe('decisionSchema', () => {
  it('defaults alternativesConsidered to an empty array', () => {
    expect(decisionSchema.parse(validDecision).alternativesConsidered).toEqual([]);
  });

  it('rejects a decision missing a description', () => {
    const { description: _omit, ...rest } = validDecision;
    expect(() => decisionSchema.parse(rest)).toThrow();
  });
});
