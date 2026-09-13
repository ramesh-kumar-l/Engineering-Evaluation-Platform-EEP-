import { describe, expect, it } from 'vitest';
import { RUN_SCHEMA_VERSION, runSchema } from './run.schema.js';

const validRun = {
  schemaVersion: RUN_SCHEMA_VERSION,
  id: 'run-001',
  experimentId: 'experiment-001',
  conditionId: 'condition-native',
  taskId: 'task-001',
  metadata: {
    taskVersion: '1.0.0',
    repositorySha: 'abc123',
    agentName: 'claude-code',
    agentVersion: '1.0.0',
    contextProviderName: 'noop',
    contextProviderVersion: '1.0.0',
    eepVersion: '0.1.0',
    evaluatorVersion: '1.0.0',
    benchmarkVersion: '1.0.0',
    environment: 'local-node20',
  },
  startedAt: '2026-09-13T00:00:00Z',
};

describe('runSchema', () => {
  it('accepts a valid run with full reproducibility metadata', () => {
    expect(runSchema.parse(validRun).metadata.agentName).toBe('claude-code');
  });

  it('rejects a run missing required metadata fields', () => {
    const { environment: _omit, ...restMetadata } = validRun.metadata;
    expect(() => runSchema.parse({ ...validRun, metadata: restMetadata })).toThrow();
  });

  it('rejects a non-semver eepVersion in metadata', () => {
    expect(() =>
      runSchema.parse({ ...validRun, metadata: { ...validRun.metadata, eepVersion: 'zero' } }),
    ).toThrow();
  });
});
