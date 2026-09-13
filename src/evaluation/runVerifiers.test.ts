import { describe, expect, it } from 'vitest';
import type { Task } from '../domain/task/task.schema.js';
import { runVerifiers } from './runVerifiers.js';
import { VerificationExecutionError, type Verifier, type VerifierContext } from './verifiers/verifier.types.js';

const task = {
  schemaVersion: '1.0.0',
  id: 'fixture-task',
  taskVersion: '1.0.0',
  title: 'Fixture task',
  description: 'n/a',
  category: 'debugging',
  complexity: 'L1',
  repository: { url: 'irrelevant', commitSha: 'abc123' },
  acceptanceCriteria: ['n/a'],
  verificationMethod: 'a fake method: check it.',
  tags: [],
  createdAt: '2026-09-13T00:00:00Z',
} as Task;

const context: VerifierContext = {
  runId: 'run-001',
  task,
  workspacePath: '/does/not/matter',
  pristineFixturePath: '/does/not/matter',
};

function makeVerifier(overrides: Partial<Verifier>): Verifier {
  return {
    method: 'test-suite',
    appliesTo: () => true,
    run: () => {
      throw new Error('not implemented in this test double');
    },
    ...overrides,
  };
}

describe('runVerifiers', () => {
  it('skips verifiers whose appliesTo returns false', async () => {
    const notApplicable = makeVerifier({ appliesTo: () => false });
    const result = await runVerifiers(context, [notApplicable]);
    expect(result.verifications).toHaveLength(0);
    expect(result.executionErrors).toHaveLength(0);
  });

  it('collects an execution error without throwing when a verifier cannot run', async () => {
    const broken = makeVerifier({
      run: () => Promise.reject(new VerificationExecutionError('boom')),
    });
    const result = await runVerifiers(context, [broken]);
    expect(result.verifications).toHaveLength(0);
    expect(result.executionErrors).toHaveLength(1);
    expect(result.executionErrors[0]?.error.message).toBe('boom');
  });

  it('wraps an unexpected thrown value as a VerificationExecutionError', async () => {
    const broken = makeVerifier({ run: () => Promise.reject(new Error('unexpected')) });
    const result = await runVerifiers(context, [broken]);
    expect(result.executionErrors[0]?.error).toBeInstanceOf(VerificationExecutionError);
  });
});
