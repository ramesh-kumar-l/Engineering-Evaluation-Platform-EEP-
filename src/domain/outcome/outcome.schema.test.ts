import { describe, expect, it } from 'vitest';
import { OUTCOME_SCHEMA_VERSION, outcomeSchema } from './outcome.schema.js';

const validOutcome = {
  schemaVersion: OUTCOME_SCHEMA_VERSION,
  id: 'outcome-001',
  runId: 'run-001',
  status: 'SUCCESS',
  summary: 'All acceptance criteria met; verified by test suite.',
  finalizedAt: '2026-09-13T00:00:00Z',
};

describe('outcomeSchema', () => {
  it('accepts a valid SUCCESS outcome', () => {
    expect(outcomeSchema.parse(validOutcome).status).toBe('SUCCESS');
  });

  it('rejects a status outside the explicit taxonomy', () => {
    expect(() => outcomeSchema.parse({ ...validOutcome, status: 'MAYBE' })).toThrow();
  });

  it('never silently defaults status when omitted', () => {
    const { status: _omit, ...rest } = validOutcome;
    expect(() => outcomeSchema.parse(rest)).toThrow();
  });
});
