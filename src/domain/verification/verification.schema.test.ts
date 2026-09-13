import { describe, expect, it } from 'vitest';
import { VERIFICATION_SCHEMA_VERSION, verificationSchema } from './verification.schema.js';

const validVerification = {
  schemaVersion: VERIFICATION_SCHEMA_VERSION,
  id: 'verification-001',
  runId: 'run-001',
  method: 'test-suite',
  passed: true,
  timestamp: '2026-09-13T00:00:00Z',
};

describe('verificationSchema', () => {
  it('defaults evidenceIds to an empty array', () => {
    expect(verificationSchema.parse(validVerification).evidenceIds).toEqual([]);
  });

  it('rejects an unknown method', () => {
    expect(() => verificationSchema.parse({ ...validVerification, method: 'vibes' })).toThrow();
  });
});
