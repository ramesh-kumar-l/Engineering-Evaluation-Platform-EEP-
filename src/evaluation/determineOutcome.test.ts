import { describe, expect, it } from 'vitest';
import { generateId } from '../domain/common/idGenerator.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { determineOutcomeStatus } from './determineOutcome.js';
import type { RunVerifiersResult } from './runVerifiers.js';
import { VerificationExecutionError, VerificationTimeoutError } from './verifiers/verifier.types.js';

function makeVerification(passed: boolean, method: Verification['method'] = 'test-suite'): Verification {
  return {
    schemaVersion: '1.0.0',
    id: generateId<'VerificationId'>('verification'),
    runId: generateId<'RunId'>('run'),
    method,
    passed,
    evidenceIds: [],
    timestamp: new Date().toISOString(),
  };
}

const EMPTY: RunVerifiersResult = { verifications: [], evidence: [], executionErrors: [] };

describe('determineOutcomeStatus', () => {
  it.each(['ENVIRONMENT_FAILURE', 'AGENT_FAILURE', 'TIMEOUT'] as const)(
    'passes %s through untouched regardless of verification results',
    (status) => {
      const result = determineOutcomeStatus(status, {
        verifications: [makeVerification(true)],
        evidence: [],
        executionErrors: [],
      });
      expect(result.status).toBe(status);
    },
  );

  it('escalates to TIMEOUT when a verifier itself timed out', () => {
    const result = determineOutcomeStatus('SUCCESS', {
      verifications: [],
      evidence: [],
      executionErrors: [{ method: 'test-suite', error: new VerificationTimeoutError('too slow') }],
    });
    expect(result.status).toBe('TIMEOUT');
  });

  it('reports EVALUATION_FAILURE when no verification could run', () => {
    const result = determineOutcomeStatus('SUCCESS', EMPTY);
    expect(result.status).toBe('EVALUATION_FAILURE');
  });

  it('reports EVALUATION_FAILURE with reasons when a verifier errored (not timeout)', () => {
    const result = determineOutcomeStatus('INCOMPLETE', {
      verifications: [],
      evidence: [],
      executionErrors: [
        { method: 'test-suite', error: new VerificationExecutionError('no test script') },
      ],
    });
    expect(result.status).toBe('EVALUATION_FAILURE');
    expect(result.summary).toContain('no test script');
  });

  it('reports SUCCESS when every executed verification passed', () => {
    const result = determineOutcomeStatus('INCOMPLETE', {
      verifications: [makeVerification(true, 'test-suite'), makeVerification(true, 'diff-analysis')],
      evidence: [],
      executionErrors: [],
    });
    expect(result.status).toBe('SUCCESS');
  });

  it('reports TASK_FAILURE when any executed verification failed, even if the agent claimed SUCCESS', () => {
    const result = determineOutcomeStatus('SUCCESS', {
      verifications: [makeVerification(true, 'diff-analysis'), makeVerification(false, 'test-suite')],
      evidence: [],
      executionErrors: [],
    });
    expect(result.status).toBe('TASK_FAILURE');
    expect(result.summary).toContain('test-suite');
  });
});
