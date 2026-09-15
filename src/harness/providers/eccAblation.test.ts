import { describe, expect, it } from 'vitest';
import {
  ECC_ABLATION_COMPONENTS,
  ablatePackage,
  ablatedConditionName,
  type EccAblationComponent,
} from './eccAblation.js';
import type { EccContextPackage } from './eccPackageSchema.js';

function samplePackage(): EccContextPackage {
  return {
    version: '0.1',
    task: { type: 'explain', request: 'explain the retriever' },
    repository: { name: 'fixture', commit: 'abc123' },
    context: {
      primary: [
        { source: 'code', path: 'src/b.ts', relevance: 0.9, trustLevel: 'fact', provenance: { source: 'code', authority: 'high' } },
        { source: 'memory', identifier: 'mem-1', relevance: 0.8, trustLevel: 'inference' },
      ],
      supporting: [
        { source: 'documentation', path: 'src/a.md', relevance: 0.5, trustLevel: 'derived', provenance: { source: 'documentation' } },
        { source: 'memory', identifier: 'mem-2', relevance: 0.3, trustLevel: 'unknown' },
      ],
    },
    conflicts: [{ subject: 'x', items: [] }],
    history: [{ claim: 'once true', trustLevel: 'derived', source: { type: 'pr', id: '1' } }],
    constraints: [{ statement: 'no breaking changes', provenance: { source: 'constraint' } }],
    unknowns: ['unknown thing'],
    verification: ['run tests'],
    excluded: [{ reason: 'over budget', count: 3 }],
  };
}

describe('ablatedConditionName', () => {
  it('names each component distinctly', () => {
    const names = ECC_ABLATION_COMPONENTS.map(ablatedConditionName);
    expect(new Set(names).size).toBe(ECC_ABLATION_COMPONENTS.length);
    expect(ablatedConditionName('history')).toBe('ecc-ablated:history');
  });
});

describe('ablatePackage', () => {
  it('never mutates the input package', () => {
    const pkg = samplePackage();
    const before = JSON.stringify(pkg);
    ablatePackage(pkg, 'history');
    expect(JSON.stringify(pkg)).toBe(before);
  });

  it('history: clears the history array, leaves everything else intact', () => {
    const ablated = ablatePackage(samplePackage(), 'history');
    expect(ablated.history).toEqual([]);
    expect(ablated.context.primary).toHaveLength(2);
    expect(ablated.conflicts).toHaveLength(1);
  });

  it('memory: removes evidence items sourced from memory, keeps other sources', () => {
    const ablated = ablatePackage(samplePackage(), 'memory');
    expect(ablated.context.primary.map((i) => i.source)).toEqual(['code']);
    expect(ablated.context.supporting.map((i) => i.source)).toEqual(['documentation']);
  });

  it('ranking: merges primary+supporting into one unranked-order list, empties supporting', () => {
    const ablated = ablatePackage(samplePackage(), 'ranking');
    expect(ablated.context.supporting).toEqual([]);
    expect(ablated.context.primary).toHaveLength(4);
    const paths = ablated.context.primary.map((i) => i.path ?? i.identifier ?? '');
    expect(paths).toEqual(['mem-1', 'mem-2', 'src/a.md', 'src/b.ts']);
  });

  it('provenance: strips provenance from every evidence item, keeps the items themselves', () => {
    const ablated = ablatePackage(samplePackage(), 'provenance');
    for (const item of [...ablated.context.primary, ...ablated.context.supporting]) {
      expect(item.provenance).toBeUndefined();
    }
    expect(ablated.context.primary).toHaveLength(2);
  });

  it('risk: clears conflicts', () => {
    const ablated = ablatePackage(samplePackage(), 'risk');
    expect(ablated.conflicts).toEqual([]);
  });

  it('budgeting: clears the excluded summary', () => {
    const ablated = ablatePackage(samplePackage(), 'budgeting');
    expect(ablated.excluded).toEqual([]);
  });

  it('verification: clears the verification plan', () => {
    const ablated = ablatePackage(samplePackage(), 'verification');
    expect(ablated.verification).toEqual([]);
  });

  it('every declared component actually changes the package relative to the full one', () => {
    const full = samplePackage();
    for (const component of ECC_ABLATION_COMPONENTS as readonly EccAblationComponent[]) {
      expect(JSON.stringify(ablatePackage(full, component))).not.toBe(JSON.stringify(full));
    }
  });
});
