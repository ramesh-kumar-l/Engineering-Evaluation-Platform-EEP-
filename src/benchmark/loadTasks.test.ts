import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultTasksDir, loadAllTasks, TaskValidationError } from './loadTasks.js';

const EXPECTED_DISTRIBUTION: Record<string, number> = {
  debugging: 6,
  feature: 6,
  refactoring: 5,
  'test-generation': 4,
  migration: 3,
  performance: 2,
  'code-review': 2,
  architecture: 2,
};

describe('loadAllTasks (real benchmark/tasks/)', () => {
  const tasks = loadAllTasks();

  it('loads exactly 30 schema-valid tasks', () => {
    expect(tasks).toHaveLength(30);
  });

  it('matches the category distribution from 07-benchmark-strategy.md', () => {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      counts[task.category] = (counts[task.category] ?? 0) + 1;
    }
    expect(counts).toEqual(EXPECTED_DISTRIBUTION);
  });

  it('gives every task a non-empty groundTruth and verificationMethod', () => {
    for (const task of tasks) {
      expect(task.groundTruth, `task ${task.id} missing groundTruth`).toBeTruthy();
      expect(task.verificationMethod, `task ${task.id} missing verificationMethod`).toBeTruthy();
    }
  });

  it('gives every task at least one acceptance criterion', () => {
    for (const task of tasks) {
      expect(task.acceptanceCriteria.length).toBeGreaterThan(0);
    }
  });

  it('uses unique task ids', () => {
    const ids = tasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves the default tasks directory to benchmark/tasks', () => {
    expect(defaultTasksDir().replace(/\\/g, '/')).toMatch(/benchmark\/tasks$/);
  });
});

describe('loadAllTasks (invalid fixture directory)', () => {
  it('throws TaskValidationError naming the offending file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'eep-benchmark-test-'));
    writeFileSync(join(dir, 'broken.json'), JSON.stringify({ id: 'x' }), 'utf-8');

    expect(() => loadAllTasks(dir)).toThrow(TaskValidationError);
    expect(() => loadAllTasks(dir)).toThrow(/broken\.json/);
  });
});
