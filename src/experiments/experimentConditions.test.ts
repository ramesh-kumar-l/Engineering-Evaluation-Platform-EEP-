import { describe, expect, it } from 'vitest';
import { buildExperimentConditions } from './experimentConditions.js';

describe('buildExperimentConditions', () => {
  it('builds exactly 9 conditions: native, full ecc, and 7 per-component ablations', () => {
    const entries = buildExperimentConditions();
    expect(entries.map((e) => e.condition.name)).toEqual([
      'native',
      'ecc',
      'ecc-ablated:history',
      'ecc-ablated:memory',
      'ecc-ablated:ranking',
      'ecc-ablated:provenance',
      'ecc-ablated:risk',
      'ecc-ablated:budgeting',
      'ecc-ablated:verification',
    ]);
  });

  it('every condition is non-oracle, with contextProviderName/Version matching its provider', () => {
    for (const entry of buildExperimentConditions()) {
      expect(entry.condition.isOracle).toBe(false);
      expect(entry.condition.contextProviderName).toBe(entry.contextProvider.name);
      expect(entry.condition.contextProviderVersion).toBe(entry.contextProvider.version);
    }
  });

  it('assigns each condition a unique id', () => {
    const entries = buildExperimentConditions();
    expect(new Set(entries.map((e) => e.condition.id)).size).toBe(entries.length);
  });
});
