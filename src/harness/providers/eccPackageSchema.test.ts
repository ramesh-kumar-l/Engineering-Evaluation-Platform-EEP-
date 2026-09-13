import { describe, expect, it } from 'vitest';
import { eccContextPackageSchema } from './eccPackageSchema.js';

function buildValidPackage() {
  return {
    version: '0.1',
    task: { type: 'explain', request: 'explain the memory retriever module' },
    repository: { name: 'Engineering-Context-Compiler', commit: 'aec9925' },
    context: {
      primary: [
        {
          source: 'code',
          path: 'src/core/memory/memoryRetriever.ts',
          symbols: ['retrieveMemoryEvidence'],
          relevance: 0.5,
          trustLevel: 'fact',
          provenance: { source: 'code', path: 'src/core/memory/memoryRetriever.ts' },
        },
      ],
      supporting: [],
    },
    conflicts: [],
    history: [],
    constraints: [],
    unknowns: [],
    verification: ['Risk: low (no elevated risk factors detected)'],
    excluded: [{ reason: 'token_budget_exceeded', count: 24 }],
  };
}

describe('eccContextPackageSchema', () => {
  it('accepts a well-formed ECC context package', () => {
    const result = eccContextPackageSchema.safeParse(buildValidPackage());
    expect(result.success).toBe(true);
  });

  it('rejects a package missing a required top-level field', () => {
    const invalid = buildValidPackage() as Record<string, unknown>;
    delete invalid.excluded;

    const result = eccContextPackageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects an evidence item with an invalid trustLevel', () => {
    const invalid = buildValidPackage();
    invalid.context.primary[0].trustLevel = 'certain' as never;

    const result = eccContextPackageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts an empty-but-well-formed package', () => {
    const empty = {
      version: '0.1',
      task: { type: 'explain', request: 'x' },
      repository: { name: 'r', commit: 'c' },
      context: { primary: [], supporting: [] },
      conflicts: [],
      history: [],
      constraints: [],
      unknowns: [],
      verification: [],
      excluded: [],
    };

    expect(eccContextPackageSchema.safeParse(empty).success).toBe(true);
  });
});
