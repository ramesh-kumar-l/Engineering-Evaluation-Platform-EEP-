import { describe, expect, it } from 'vitest';
import { CONDITION_SCHEMA_VERSION } from './condition.schema.js';
import { EXPERIMENT_SCHEMA_VERSION, experimentSchema } from './experiment.schema.js';

const condition = {
  schemaVersion: CONDITION_SCHEMA_VERSION,
  id: 'condition-native',
  name: 'Native Agent',
  description: 'Baseline, no context provider.',
  contextProviderName: 'noop',
  contextProviderVersion: '1.0.0',
  isOracle: false,
};

const validExperiment = {
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  id: 'experiment-001',
  name: 'ECC vs native baseline',
  hypothesis: 'ECC-generated context improves task success over native exploration.',
  taskIds: ['task-001'],
  conditions: [condition],
  agentName: 'claude-code',
  agentVersion: '1.0.0',
  evaluatorVersion: '1.0.0',
  benchmarkVersion: '1.0.0',
  createdAt: '2026-09-13T00:00:00Z',
};

describe('experimentSchema', () => {
  it('accepts a valid experiment', () => {
    expect(experimentSchema.parse(validExperiment).conditions).toHaveLength(1);
  });

  it('rejects an experiment with no tasks', () => {
    expect(() => experimentSchema.parse({ ...validExperiment, taskIds: [] })).toThrow();
  });

  it('rejects an experiment with no conditions', () => {
    expect(() => experimentSchema.parse({ ...validExperiment, conditions: [] })).toThrow();
  });
});
