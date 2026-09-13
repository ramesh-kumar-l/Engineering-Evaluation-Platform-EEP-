import { resolve } from 'node:path';
import { generateId } from '../domain/common/idGenerator.js';
import { isoTimestampSchema } from '../domain/common/timestamps.js';
import type { Evidence } from '../domain/evidence/evidence.schema.js';
import { outcomeSchema, type Outcome } from '../domain/outcome/outcome.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import {
  defaultRepoRoot,
  executeRun,
  type HarnessDependencies,
  type HarnessRunConfig,
  type HarnessRunOutcome,
} from '../harness/runHarness.js';
import type { Task } from '../domain/task/task.schema.js';
import { determineOutcomeStatus } from './determineOutcome.js';
import { runVerifiers, type RunVerifiersResult } from './runVerifiers.js';
import { ALL_VERIFIERS } from './verifiers/index.js';
import type { Verifier } from './verifiers/verifier.types.js';

export interface EvaluatedRunOutcome extends HarnessRunOutcome {
  readonly outcome: Outcome;
  readonly verifications: Verification[];
  readonly evidence: Evidence[];
  /** Verifiers that applied but could not execute — Phase 5 metrics use this for verification-completeness. */
  readonly executionErrors: RunVerifiersResult['executionErrors'];
}

const EMPTY_VERIFIER_RESULT: RunVerifiersResult = {
  verifications: [],
  evidence: [],
  executionErrors: [],
};

/**
 * Phase 4 entry point: runs a Task exactly as `executeRun` does (Phase 3), then — while the
 * workspace still exists — runs every applicable verifier and turns the result into an
 * authoritative `Outcome`. See project-memory-bank/06-evaluation-methodology.md and
 * [[determineOutcome]] for why `Outcome.status` and `Trace.agentReportedStatus` may legitimately
 * disagree (the latter is never authoritative).
 */
export async function executeEvaluatedRun(
  task: Task,
  deps: HarnessDependencies,
  config: HarnessRunConfig,
  verifiers: readonly Verifier[] = ALL_VERIFIERS,
): Promise<EvaluatedRunOutcome> {
  const pristineFixturePath = resolve(config.repoRoot ?? defaultRepoRoot(), task.repository.url);

  let verifierResult: RunVerifiersResult = EMPTY_VERIFIER_RESULT;

  const { run, trace, contextArtifact } = await executeRun(
    task,
    {
      ...deps,
      onBeforeCleanup: async ({ workspacePath, runId }) => {
        verifierResult = await runVerifiers(
          { runId, task, workspacePath, pristineFixturePath },
          verifiers,
        );
      },
    },
    config,
  );

  const determined = determineOutcomeStatus(
    trace.agentReportedStatus ?? 'EVALUATION_FAILURE',
    verifierResult,
  );

  const evidenceIds = [...new Set(verifierResult.verifications.flatMap((v) => v.evidenceIds))];

  const outcome = outcomeSchema.parse({
    schemaVersion: '1.0.0',
    id: generateId<'OutcomeId'>('outcome'),
    runId: run.id,
    status: determined.status,
    summary: determined.summary,
    verificationIds: verifierResult.verifications.map((v) => v.id),
    evidenceIds,
    finalizedAt: isoTimestampSchema.parse(new Date().toISOString()),
  });

  return {
    run,
    trace,
    contextArtifact,
    outcome,
    verifications: verifierResult.verifications,
    evidence: verifierResult.evidence,
    executionErrors: verifierResult.executionErrors,
  };
}
