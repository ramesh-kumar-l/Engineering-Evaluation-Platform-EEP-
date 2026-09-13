import { describe, expect, it } from 'vitest';
import { CONDITION_SCHEMA_VERSION, conditionSchema } from './condition.schema.js';

const validCondition = {
  schemaVersion: CONDITION_SCHEMA_VERSION,
  id: 'condition-native',
  name: 'Native Agent',
  description: 'Agent explores the repository natively, no external context provider.',
  contextProviderName: 'noop',
  contextProviderVersion: '1.0.0',
};

describe('conditionSchema', () => {
  it('defaults isOracle to false', () => {
    expect(conditionSchema.parse(validCondition).isOracle).toBe(false);
  });

  it('accepts an explicit oracle condition', () => {
    const parsed = conditionSchema.parse({ ...validCondition, isOracle: true });
    expect(parsed.isOracle).toBe(true);
  });

  it('rejects a non-semver contextProviderVersion', () => {
    expect(() =>
      conditionSchema.parse({ ...validCondition, contextProviderVersion: 'v1' }),
    ).toThrow();
  });
});
