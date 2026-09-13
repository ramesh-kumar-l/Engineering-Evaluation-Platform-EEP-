import type { ContextArtifact } from '../domain/evidence/context-artifact.schema.js';
import type { Evidence } from '../domain/evidence/evidence.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Trace } from '../domain/trace/trace.schema.js';
import type { Verification, VerificationMethod } from '../domain/verification/verification.schema.js';

/** One verifier that applied to the task but could not be executed — see `runVerifiers`. */
export interface MetricsExecutionError {
  readonly method: VerificationMethod;
  readonly error: unknown;
}

/**
 * Everything `computeRunMetrics` needs from one completed, evaluated run. Deliberately
 * structural (not a direct re-export of `EvaluatedRunOutcome`) so the metrics layer stays
 * decoupled from the evaluation layer's own type — any object with this shape works, matching
 * the same one-way-dependency discipline used between `evaluation/` and `harness/`.
 */
export interface RunMetricsInput {
  readonly run: Run;
  readonly trace: Trace;
  readonly outcome: Outcome;
  readonly verifications: readonly Verification[];
  readonly evidence: readonly Evidence[];
  readonly contextArtifact?: ContextArtifact;
  readonly executionErrors: readonly MetricsExecutionError[];
}
