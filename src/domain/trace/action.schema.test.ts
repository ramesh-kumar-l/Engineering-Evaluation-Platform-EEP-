import { describe, expect, it } from 'vitest';
import { ACTION_SCHEMA_VERSION, actionSchema } from './action.schema.js';

const validAction = {
  schemaVersion: ACTION_SCHEMA_VERSION,
  id: 'action-001',
  runId: 'run-001',
  type: 'file-edit',
  target: 'src/pagination.ts',
  timestamp: '2026-09-13T00:00:00Z',
};

describe('actionSchema', () => {
  it('accepts a valid action', () => {
    expect(actionSchema.parse(validAction).type).toBe('file-edit');
  });

  it('rejects an unknown action type', () => {
    expect(() => actionSchema.parse({ ...validAction, type: 'teleport' })).toThrow();
  });
});
