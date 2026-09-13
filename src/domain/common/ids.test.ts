import { describe, expect, it } from 'vitest';
import { taskIdSchema, runIdSchema } from './ids.js';

describe('branded id schemas', () => {
  it('accepts a non-empty string', () => {
    expect(taskIdSchema.parse('task-001')).toBe('task-001');
  });

  it('rejects an empty string', () => {
    expect(() => runIdSchema.parse('')).toThrow();
  });
});
