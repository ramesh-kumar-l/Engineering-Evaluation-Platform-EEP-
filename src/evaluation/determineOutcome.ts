import type { RunStatus } from '../domain/common/status.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import type { RunVerifiersResult } from './runVerifiers.js';
import { VerificationTimeoutError } from './verifiers/verifier.types.js';

export interface DeterminedOutcome {
  readonly status: RunStatus;
  readonly summary: string;
}

const INFRASTRUCTURE_STATUSES: readonly RunStatus[] = [
  'ENVIRONMENT_FAILURE',
  'AGENT_FAILURE',
  'TIMEOUT',
];

/**
 * The single authority for turning verification results into an Outcome status — see
 * project-memory-bank/06-evaluation-methodology.md §Explicit failure taxonomy. Pure function
 * (no I/O) so its rules can be unit-tested exhaustively without spawning processes.
 *
 * Rules, in order:
 * 1. Infrastructure-level self-reports (ENVIRONMENT_FAILURE, AGENT_FAILURE, TIMEOUT) pass
 *    through untouched — verification cannot meaningfully run and must never be blamed on the
 *    task or the agent's engineering judgment.
 * 2. A verifier that itself timed out escalates the whole run to TIMEOUT.
 * 3. If no verification could be executed at all, the result is EVALUATION_FAILURE — evaluation
 *    was unavailable, which is never the same claim as "the task was solved incorrectly."
 * 4. Otherwise, the agent's own SUCCESS/INCOMPLETE self-report is irrelevant: the run is SUCCESS
 *    only if every executed verification passed, and TASK_FAILURE otherwise. This is the crux of
 *    Phase 4 — `agentReportedStatus` is provenance only; verification is authoritative.
 */
export function determineOutcomeStatus(
  agentReportedStatus: RunStatus,
  verifierResult: RunVerifiersResult,
): DeterminedOutcome {
  if (INFRASTRUCTURE_STATUSES.includes(agentReportedStatus)) {
    return {
      status: agentReportedStatus,
      summary: `Run did not reach verification: agent-reported status was ${agentReportedStatus}.`,
    };
  }

  const timedOut = verifierResult.executionErrors.some(
    (e) => e.error instanceof VerificationTimeoutError,
  );
  if (timedOut) {
    return {
      status: 'TIMEOUT',
      summary: 'A verification check exceeded its time budget.',
    };
  }

  if (verifierResult.verifications.length === 0) {
    const reasons = verifierResult.executionErrors.map((e) => `${e.method}: ${e.error.message}`);
    return {
      status: 'EVALUATION_FAILURE',
      summary:
        reasons.length > 0
          ? `No verification could be executed: ${reasons.join('; ')}`
          : 'No applicable verifier found for this task\'s verificationMethod.',
    };
  }

  const failed = verifierResult.verifications.filter((v) => !v.passed);
  if (failed.length === 0) {
    return {
      status: 'SUCCESS',
      summary: `All ${String(verifierResult.verifications.length)} verification(s) passed.`,
    };
  }

  return {
    status: 'TASK_FAILURE',
    summary: `${String(failed.length)} of ${String(
      verifierResult.verifications.length,
    )} verification(s) failed: ${summarizeFailures(failed)}.`,
  };
}

function summarizeFailures(failed: Verification[]): string {
  return failed.map((v) => `${v.method} (${v.detail ?? 'no detail'})`).join('; ');
}
