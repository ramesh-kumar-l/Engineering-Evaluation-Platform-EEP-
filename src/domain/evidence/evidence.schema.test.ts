import { describe, expect, it } from 'vitest';
import { EVIDENCE_SCHEMA_VERSION, evidenceSchema } from './evidence.schema.js';

const validEvidence = {
  schemaVersion: EVIDENCE_SCHEMA_VERSION,
  id: 'evidence-001',
  kind: 'test-result',
  description: 'Full test suite passed after the fix.',
  source: 'vitest run',
  createdAt: '2026-09-13T00:00:00Z',
};

describe('evidenceSchema', () => {
  it('accepts valid evidence without content', () => {
    expect(evidenceSchema.parse(validEvidence).redacted).toBe(false);
  });

  it('rejects an unknown kind', () => {
    expect(() => evidenceSchema.parse({ ...validEvidence, kind: 'rumor' })).toThrow();
  });
});
