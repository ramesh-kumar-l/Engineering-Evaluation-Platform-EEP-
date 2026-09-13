import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Task } from '../../domain/task/task.schema.js';
import { NativeAgent } from './nativeAgent.js';

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

describe('NativeAgent', () => {
  it('records one file-read action per repository file and reports INCOMPLETE', async () => {
    const repo = mkdtempSync(join(tmpdir(), 'eep-nativeagent-test-'));
    writeFileSync(join(repo, 'pagination.js'), 'module.exports = {};', 'utf-8');
    writeFileSync(join(repo, 'pagination.test.js'), 'test();', 'utf-8');

    const result = await new NativeAgent().run({ runId: 'run-001', task, repositoryPath: repo });

    expect(result.status).toBe('INCOMPLETE');
    expect(result.actions).toHaveLength(2);
    expect(result.actions.every((a) => a.type === 'file-read' && a.runId === 'run-001')).toBe(
      true,
    );
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]?.runId).toBe('run-001');
  });
});
