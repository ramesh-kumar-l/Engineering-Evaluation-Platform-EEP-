import { describe, expect, it } from 'vitest';
import {
  CONTEXT_ARTIFACT_SCHEMA_VERSION,
  contextArtifactSchema,
} from './context-artifact.schema.js';

const validArtifact = {
  schemaVersion: CONTEXT_ARTIFACT_SCHEMA_VERSION,
  id: 'artifact-001',
  runId: 'run-001',
  providerName: 'ecc',
  providerVersion: '1.0.0',
  content: 'relevant file summaries and provenance records',
  createdAt: '2026-09-13T00:00:00Z',
};

describe('contextArtifactSchema', () => {
  it('defaults redacted to false', () => {
    expect(contextArtifactSchema.parse(validArtifact).redacted).toBe(false);
  });

  it('rejects a negative tokenCount', () => {
    expect(() => contextArtifactSchema.parse({ ...validArtifact, tokenCount: -1 })).toThrow();
  });
});
