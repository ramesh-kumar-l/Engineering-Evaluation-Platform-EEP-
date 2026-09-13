import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateId } from '../../domain/common/idGenerator.js';
import type { RunId } from '../../domain/common/ids.js';
import type { Task } from '../../domain/task/task.schema.js';
import { EccContextProvider } from './eccContextProvider.js';

/**
 * Real, end-to-end proof that EccContextProvider talks to an actual ECC checkout via its
 * documented CLI only — no ECC source is imported anywhere in EEP. Gated on a sibling
 * `Engineering-Context-Compiler` checkout being present and built on this machine, so the
 * suite stays green (via a skip, not a failure) in any environment that only has this repo
 * checked out — see project-memory-bank/phases/phase-06.md for how to point this at a
 * different checkout location.
 */
const here = dirname(fileURLToPath(import.meta.url));
const ECC_CLI_ENTRY = resolve(here, '../../../../Engineering-Context-Compiler/dist/cli/index.js');
const hasRealEcc = existsSync(ECC_CLI_ENTRY);

describe.skipIf(!hasRealEcc)('EccContextProvider (real ECC CLI)', () => {
  it('produces a ContextArtifact from a real ECC invocation against this repository', async () => {
    const provider = new EccContextProvider({
      command: process.execPath,
      commandArgs: [ECC_CLI_ENTRY],
      tokenBudget: 800,
      timeoutMs: 60_000,
    });

    const task: Task = {
      schemaVersion: '1.0.0',
      id: generateId<'TaskId'>('task'),
      taskVersion: '1.0.0',
      title: 'Explain the metrics module',
      description: 'explain the metrics computation module',
      category: 'architecture',
      complexity: 'L2',
      repository: { url: 'file:///eep', commitSha: 'unpinned' },
      acceptanceCriteria: ['Explanation is accurate'],
      verificationMethod: 'human-review',
      tags: [],
      createdAt: new Date().toISOString(),
    };

    const runId = generateId<'RunId'>('run') as RunId;
    const repositoryPath = resolve(here, '../../..');

    const result = await provider.provideContext({ runId, task, repositoryPath });

    expect(result.contextArtifact.providerName).toBe('ecc');
    expect(result.contextArtifact.content).toContain('"version"');
    const pkg: { task: { request: string } } = JSON.parse(result.contextArtifact.content) as {
      task: { request: string };
    };
    expect(pkg.task.request).toBe(task.description);
  }, 60_000);
});
