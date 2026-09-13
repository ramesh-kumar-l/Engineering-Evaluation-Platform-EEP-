import { describe, expect, it } from 'vitest';
import { TRACE_SCHEMA_VERSION, traceSchema } from './trace.schema.js';

const validTrace = {
  schemaVersion: TRACE_SCHEMA_VERSION,
  id: 'trace-001',
  runId: 'run-001',
  startedAt: '2026-09-13T00:00:00Z',
};

describe('traceSchema', () => {
  it('applies defaults for actions, decisions, retries and redactionApplied', () => {
    const parsed = traceSchema.parse(validTrace);
    expect(parsed.actions).toEqual([]);
    expect(parsed.decisions).toEqual([]);
    expect(parsed.retries).toBe(0);
    expect(parsed.redactionApplied).toBe(false);
  });

  it('rejects a negative retries count', () => {
    expect(() => traceSchema.parse({ ...validTrace, retries: -1 })).toThrow();
  });

  it('accepts an optional agentReportedStatus and leaves it undefined by default', () => {
    expect(traceSchema.parse(validTrace).agentReportedStatus).toBeUndefined();
    const parsed = traceSchema.parse({ ...validTrace, agentReportedStatus: 'INCOMPLETE' });
    expect(parsed.agentReportedStatus).toBe('INCOMPLETE');
  });
});
