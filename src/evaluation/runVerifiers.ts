import type { Evidence } from '../domain/evidence/evidence.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import { ALL_VERIFIERS } from './verifiers/index.js';
import { VerificationExecutionError, type Verifier, type VerifierContext } from './verifiers/verifier.types.js';

export interface RunVerifiersResult {
  readonly verifications: Verification[];
  readonly evidence: Evidence[];
  /** Verifiers that applied but could not be executed — surfaced for diagnostics/logging only. */
  readonly executionErrors: { method: Verifier['method']; error: VerificationExecutionError }[];
}

/**
 * Runs every verifier applicable to this task's `verificationMethod` text and collects the
 * results — see project-memory-bank/06-evaluation-methodology.md §Multi-evidence outcome
 * evaluation ("prefer combining, where available"). A verifier that cannot be executed at all is
 * recorded as an execution error rather than a failed check — see [[determineOutcome]] for why
 * that distinction matters.
 */
export async function runVerifiers(
  context: VerifierContext,
  verifiers: readonly Verifier[] = ALL_VERIFIERS,
): Promise<RunVerifiersResult> {
  const applicable = verifiers.filter((v) => v.appliesTo(context.task));

  const verifications: Verification[] = [];
  const evidence: Evidence[] = [];
  const executionErrors: RunVerifiersResult['executionErrors'] = [];

  for (const verifier of applicable) {
    try {
      const result = await verifier.run(context);
      verifications.push(result.verification);
      evidence.push(...result.evidence);
    } catch (error) {
      const executionError =
        error instanceof VerificationExecutionError
          ? error
          : new VerificationExecutionError('Verifier threw an unexpected error', error);
      executionErrors.push({ method: verifier.method, error: executionError });
    }
  }

  return { verifications, evidence, executionErrors };
}
