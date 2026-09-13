import { describe, expect, it } from 'vitest';
import { TASK_SCHEMA_VERSION, taskSchema } from './task.schema.js';

const validTask = {
  schemaVersion: TASK_SCHEMA_VERSION,
  id: 'task-001',
  taskVersion: '1.0.0',
  title: 'Fix off-by-one in pagination',
  description: 'The last page of results is dropped when total % pageSize === 0.',
  category: 'debugging',
  complexity: 'L2',
  repository: { url: 'https://example.com/repo.git', commitSha: 'abc123' },
  acceptanceCriteria: ['Last page is returned', 'Existing tests still pass'],
  verificationMethod: 'test-suite',
  createdAt: '2026-09-13T00:00:00Z',
};

describe('taskSchema', () => {
  it('accepts a fully valid task', () => {
    const parsed = taskSchema.parse(validTask);
    expect(parsed.tags).toEqual([]);
  });

  it('rejects a task with an unknown category', () => {
    expect(() => taskSchema.parse({ ...validTask, category: 'not-a-category' })).toThrow();
  });

  it('rejects a task with no acceptance criteria', () => {
    expect(() => taskSchema.parse({ ...validTask, acceptanceCriteria: [] })).toThrow();
  });

  it('rejects a mismatched schemaVersion', () => {
    expect(() => taskSchema.parse({ ...validTask, schemaVersion: '0.9.0' })).toThrow();
  });
});
