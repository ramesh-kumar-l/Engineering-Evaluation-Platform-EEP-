import { describe, expect, it } from 'vitest';
import { generateId } from '../../domain/common/idGenerator.js';
import type { RunId } from '../../domain/common/ids.js';
import type { Task } from '../../domain/task/task.schema.js';
import type { EccCliInvoker } from './eccCliInvoker.js';
import { EccInvocationError } from './eccCliInvoker.js';
import { EccContextProvider } from './eccContextProvider.js';

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
    context: { primary: [], supporting: [] },
    conflicts: [],
    history: [],
    constraints: [],
    unknowns: [],
    verification: [],
    excluded: [],
  });
}

function fakeInvoker(stdout: string | Error): EccCliInvoker {
  return {
    invoke: () => (stdout instanceof Error ? Promise.reject(stdout) : Promise.resolve(stdout)),
  };
}

describe('EccContextProvider', () => {
  it('builds a schema-valid ContextArtifact from a valid ECC package', async () => {
    const provider = new EccContextProvider({ invoker: fakeInvoker(buildValidPackageJson()) });

    const result = await provider.provideContext({ runId, task, repositoryPath: '/fixture' });

    expect(result.contextArtifact.runId).toBe(runId);
    expect(result.contextArtifact.providerName).toBe('ecc');
    expect(result.contextArtifact.content).toContain('"version": "0.1"');
    expect(result.contextArtifact.tokenCount).toBeGreaterThan(0);
  });

  it('propagates the invoker error when the CLI itself fails', async () => {
    const provider = new EccContextProvider({
      invoker: fakeInvoker(new EccInvocationError('CLI exploded')),
    });

    await expect(
      provider.provideContext({ runId, task, repositoryPath: '/fixture' }),
    ).rejects.toThrow(EccInvocationError);
  });

  it('throws EccInvocationError when stdout is not valid JSON', async () => {
    const provider = new EccContextProvider({ invoker: fakeInvoker('not json at all') });

    await expect(
      provider.provideContext({ runId, task, repositoryPath: '/fixture' }),
    ).rejects.toThrow(EccInvocationError);
  });

  it('throws EccInvocationError when the JSON does not match the package schema', async () => {
    const provider = new EccContextProvider({
      invoker: fakeInvoker(JSON.stringify({ unexpected: true })),
    });

    await expect(
      provider.provideContext({ runId, task, repositoryPath: '/fixture' }),
    ).rejects.toThrow(EccInvocationError);
  });
});
