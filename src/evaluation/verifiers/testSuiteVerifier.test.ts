import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Task } from '../../domain/task/task.schema.js';
import { VerificationExecutionError } from './verifier.types.js';
import { testSuiteVerifier } from './testSuiteVerifier.js';

const baseTask = {
  schemaVersion: '1.0.0',
  id: 'fixture-task',
  taskVersion: '1.0.0',
  title: 'Fixture task',
  description: 'A fixture task used only in tests.',
  category: 'debugging',
  complexity: 'L1',
  repository: { url: 'irrelevant', commitSha: 'abc123' },
  acceptanceCriteria: ['n/a'],
  verificationMethod: 'test-suite: run the fixture tests.',
  tags: [],
  createdAt: '2026-09-13T00:00:00Z',
} as Task;

function makeWorkspace(testScriptBody: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'eep-testsuite-verifier-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'fixture', scripts: { test: 'node run.test.js' } }),
    'utf-8',
  );
  writeFileSync(join(dir, 'run.test.js'), testScriptBody, 'utf-8');
  return dir;
}

describe('testSuiteVerifier', () => {
  it(
    'reports passed: true when npm test exits 0',
    async () => {
      const workspacePath = makeWorkspace('process.exit(0);');
      const { verification, evidence } = await testSuiteVerifier.run({
        runId: 'run-001',
        task: baseTask,
        workspacePath,
        pristineFixturePath: workspacePath,
      });

      expect(verification.method).toBe('test-suite');
      expect(verification.passed).toBe(true);
      expect(verification.runId).toBe('run-001');
      expect(evidence).toHaveLength(1);
      expect(evidence[0]?.kind).toBe('test-result');
    },
    20_000,
  );

  it(
    'reports passed: false when npm test exits non-zero',
    async () => {
      const workspacePath = makeWorkspace('process.exit(1);');
      const { verification } = await testSuiteVerifier.run({
        runId: 'run-001',
        task: baseTask,
        workspacePath,
        pristineFixturePath: workspacePath,
      });

      expect(verification.passed).toBe(false);
    },
    20_000,
  );

  it('throws VerificationExecutionError when package.json has no test script', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'eep-testsuite-verifier-notests-'));
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture' }), 'utf-8');

    await expect(
      testSuiteVerifier.run({
        runId: 'run-001',
        task: baseTask,
        workspacePath: dir,
        pristineFixturePath: dir,
      }),
    ).rejects.toBeInstanceOf(VerificationExecutionError);
  });

  it('appliesTo matches only when verificationMethod mentions test-suite', () => {
    expect(testSuiteVerifier.appliesTo(baseTask)).toBe(true);
    expect(
      testSuiteVerifier.appliesTo({ ...baseTask, verificationMethod: 'diff-analysis: check it.' }),
    ).toBe(false);
  });
});
