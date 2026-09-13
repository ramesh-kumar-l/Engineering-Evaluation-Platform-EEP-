import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Task } from '../../domain/task/task.schema.js';
import { diffAnalysisVerifier } from './diffAnalysisVerifier.js';

const task = {
  schemaVersion: '1.0.0',
  id: 'fixture-task',
  taskVersion: '1.0.0',
  title: 'Fixture task',
  description: 'A fixture task used only in tests.',
  category: 'refactoring',
  complexity: 'L2',
  repository: { url: 'irrelevant', commitSha: 'abc123' },
  acceptanceCriteria: ['n/a'],
  verificationMethod: 'diff-analysis: confirm duplication removed.',
  tags: [],
  createdAt: '2026-09-13T00:00:00Z',
} as Task;

describe('diffAnalysisVerifier', () => {
  it('reports passed: false when the workspace is byte-identical to the pristine fixture', async () => {
    const pristine = mkdtempSync(join(tmpdir(), 'eep-diff-pristine-'));
    const workspace = mkdtempSync(join(tmpdir(), 'eep-diff-workspace-'));
    writeFileSync(join(pristine, 'a.js'), 'module.exports = 1;', 'utf-8');
    writeFileSync(join(workspace, 'a.js'), 'module.exports = 1;', 'utf-8');

    const { verification } = await diffAnalysisVerifier.run({
      runId: 'run-001',
      task,
      workspacePath: workspace,
      pristineFixturePath: pristine,
    });

    expect(verification.passed).toBe(false);
  });

  it('reports passed: true and names the changed file when content differs', async () => {
    const pristine = mkdtempSync(join(tmpdir(), 'eep-diff-pristine-'));
    const workspace = mkdtempSync(join(tmpdir(), 'eep-diff-workspace-'));
    writeFileSync(join(pristine, 'a.js'), 'module.exports = 1;', 'utf-8');
    writeFileSync(join(workspace, 'a.js'), 'module.exports = 2;', 'utf-8');

    const { verification, evidence } = await diffAnalysisVerifier.run({
      runId: 'run-001',
      task,
      workspacePath: workspace,
      pristineFixturePath: pristine,
    });

    expect(verification.passed).toBe(true);
    expect(verification.detail).toContain('a.js');
    expect(evidence[0]?.kind).toBe('diff');
  });

  it('appliesTo matches only when verificationMethod mentions diff-analysis', () => {
    expect(diffAnalysisVerifier.appliesTo(task)).toBe(true);
    expect(
      diffAnalysisVerifier.appliesTo({ ...task, verificationMethod: 'test-suite: run tests.' }),
    ).toBe(false);
  });
});
