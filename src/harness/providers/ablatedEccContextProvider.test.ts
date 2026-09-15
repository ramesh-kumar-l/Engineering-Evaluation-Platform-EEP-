import { describe, expect, it } from 'vitest';
import { generateId } from '../../domain/common/idGenerator.js';
import type { RunId } from '../../domain/common/ids.js';
import type { Task } from '../../domain/task/task.schema.js';
import type { EccCliInvoker } from './eccCliInvoker.js';
import { EccInvocationError } from './eccCliInvoker.js';
import { AblatedEccContextProvider } from './ablatedEccContextProvider.js';
import { ECC_ABLATION_COMPONENTS, ablatedConditionName, type EccAblationComponent } from './eccAblation.js';

const runId = generateId<'RunId'>('run') as RunId;

const task: Task = {
  schemaVersion: '1.0.0',
  id: generateId<'TaskId'>('task'),
  taskVersion: '1.0.0',
  title: 'Explain the retriever',
  description: 'explain the memory retriever module',
  category: 'architecture',
  complexity: 'L2',
  repository: { url: 'file:///fixture', commitSha: 'unpinned' },
  acceptanceCriteria: ['Explanation is accurate'],
  verificationMethod: 'human-review',
  tags: [],
  createdAt: new Date().toISOString(),
};

function buildValidPackageJson(): string {
  return JSON.stringify({
    version: '0.1',
    task: { type: 'explain', request: task.description },
    repository: { name: 'fixture', commit: 'abc123' },
    context: {
      primary: [{ source: 'memory', identifier: 'mem-1', relevance: 0.5, trustLevel: 'inference' }],
      supporting: [
        {
          source: 'documentation',
          path: 'docs/x.md',
          relevance: 0.4,
          trustLevel: 'derived',
          provenance: { source: 'documentation', authority: 'medium' },
        },
      ],
    },
    conflicts: [{ subject: 'x', items: [] }],
    history: [{ claim: 'once true', trustLevel: 'derived', source: { type: 'pr', id: '1' } }],
    constraints: [],
    unknowns: [],
    verification: ['run tests'],
    excluded: [{ reason: 'over budget', count: 1 }],
  });
}

function fakeInvoker(stdout: string | Error): EccCliInvoker {
  return {
    invoke: () => (stdout instanceof Error ? Promise.reject(stdout) : Promise.resolve(stdout)),
  };
}

describe('AblatedEccContextProvider', () => {
  it('names itself per the ablatedConditionName convention', () => {
    const provider = new AblatedEccContextProvider('history', { invoker: fakeInvoker(buildValidPackageJson()) });
    expect(provider.name).toBe(ablatedConditionName('history'));
  });

  it('builds a ContextArtifact whose content has the ablated component removed', async () => {
    const provider = new AblatedEccContextProvider('history', { invoker: fakeInvoker(buildValidPackageJson()) });

    const result = await provider.provideContext({ runId, task, repositoryPath: '/fixture' });
    const content = JSON.parse(result.contextArtifact.content) as { history: unknown[] };

    expect(result.contextArtifact.runId).toBe(runId);
    expect(result.contextArtifact.providerName).toBe('ecc-ablated:history');
    expect(content.history).toEqual([]);
    expect(result.contextArtifact.tokenCount).toBeGreaterThan(0);
  });

  it.each(ECC_ABLATION_COMPONENTS)('produces distinct, ablated content for component "%s"', async (component) => {
    const provider = new AblatedEccContextProvider(component as EccAblationComponent, {
      invoker: fakeInvoker(buildValidPackageJson()),
    });

    const result = await provider.provideContext({ runId, task, repositoryPath: '/fixture' });

    expect(result.contextArtifact.content).not.toBe(JSON.stringify(JSON.parse(buildValidPackageJson()), null, 2));
  });

  it('propagates the invoker error when the CLI itself fails', async () => {
    const provider = new AblatedEccContextProvider('risk', {
      invoker: fakeInvoker(new EccInvocationError('CLI exploded')),
    });

    await expect(
      provider.provideContext({ runId, task, repositoryPath: '/fixture' }),
    ).rejects.toThrow(EccInvocationError);
  });

  it('throws EccInvocationError when stdout is not valid JSON', async () => {
    const provider = new AblatedEccContextProvider('risk', { invoker: fakeInvoker('not json at all') });

    await expect(
      provider.provideContext({ runId, task, repositoryPath: '/fixture' }),
    ).rejects.toThrow(EccInvocationError);
  });

  it('throws EccInvocationError when the JSON does not match the package schema', async () => {
    const provider = new AblatedEccContextProvider('risk', {
      invoker: fakeInvoker(JSON.stringify({ unexpected: true })),
    });

    await expect(
      provider.provideContext({ runId, task, repositoryPath: '/fixture' }),
    ).rejects.toThrow(EccInvocationError);
  });
});
