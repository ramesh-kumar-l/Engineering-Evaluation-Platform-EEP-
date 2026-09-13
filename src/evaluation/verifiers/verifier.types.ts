import type { RunId } from '../../domain/common/ids.js';
import type { Evidence } from '../../domain/evidence/evidence.schema.js';
import type { Task } from '../../domain/task/task.schema.js';
import type { Verification } from '../../domain/verification/verification.schema.js';

/** Everything a Verifier needs to inspect a completed run's filesystem state. */
export interface VerifierContext {
  readonly runId: RunId;
  readonly task: Task;
  /** The (possibly agent-modified) isolated workspace — inspect this, never mutate it. */
  readonly workspacePath: string;
  /** The original, untouched fixture directory — the baseline for diff-style checks. */
  readonly pristineFixturePath: string;
}

export interface VerifierResult {
  readonly verification: Verification;
  readonly evidence: Evidence[];
}

/**
 * One executable check contributing evidence toward an Outcome — see
 * project-memory-bank/06-evaluation-methodology.md §Multi-evidence outcome evaluation. Multiple
 * verifiers may apply to the same task; the evaluator combines all of them (never relies on a
 * single method), per the same section.
 */
export interface Verifier {
  readonly method: Verification['method'];
  /** Text-matches task.verificationMethod to decide whether this verifier is relevant. */
  appliesTo(task: Task): boolean;
  /**
   * Runs the check. Throws `VerificationExecutionError` (or `VerificationTimeoutError`) if the
   * check itself could not be carried out — this is distinct from the check running and finding
   * the task unsolved (that is a normal `VerifierResult` with `passed: false`).
   */
  run(context: VerifierContext): Promise<VerifierResult>;
}

/** Thrown when a verifier could not be executed at all (infra problem, not a failed check). */
export class VerificationExecutionError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'VerificationExecutionError';
  }
}

/** Thrown when a verifier's underlying process exceeded its allotted time budget. */
export class VerificationTimeoutError extends VerificationExecutionError {
  constructor(message: string) {
    super(message);
    this.name = 'VerificationTimeoutError';
  }
}
