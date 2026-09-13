import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Task } from '../../domain/task/task.schema.js';
import { NativeContextProvider } from './nativeContextProvider.js';

const task = {
  schemaVersion: '1.0.0',
  id: 'debugging-01',
  taskVersion: '1.0.0',
  title: 'Off-by-one error in pagination utility',
  description: 'Fix the pagination boundary bug.',
  category: 'debugging',
  complexity: 'L1',
  repository: { url: 'benchmark/fixtures/debugging-01', commitSha: 'abc123' },
  acceptanceCriteria: ['paginate() returns correct pages.'],
  verificationMethod: 'test-suite: run the pagination tests.',
  tags: [],
  createdAt: '2026-09-13T00:00:00Z',
} as Task;

describe('NativeContextProvider', () => {
  it('produces a context artifact with the task text and a file listing', async () => {
    const repo = mkdtempSync(join(tmpdir(), 'eep-ctxprovider-test-'));
    writeFileSync(join(repo, 'pagination.js'), 'module.exports = {};', 'utf-8');

    const provider = new NativeContextProvider();
    const result = await provider.provideContext({ runId: 'run-001', task, repositoryPath: repo });

    expect(result.contextArtifact.runId).toBe('run-001');
    expect(result.contextArtifact.providerName).toBe('native');
    expect(result.contextArtifact.content).toContain(task.title);
    expect(result.contextArtifact.content).toContain('pagination.js');
    expect(result.contextArtifact.redacted).toBe(false);
  });
});
