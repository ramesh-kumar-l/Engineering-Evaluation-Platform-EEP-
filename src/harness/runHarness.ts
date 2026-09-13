import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateId } from '../domain/common/idGenerator.js';
import type { ConditionId, ExperimentId, RunId } from '../domain/common/ids.js';
import type { RunStatus } from '../domain/common/status.js';
import type { Agent } from '../domain/providers/agent.js';
import type { ContextProvider } from '../domain/providers/context-provider.js';
import { runSchema, type Run } from '../domain/run/run.schema.js';
import type { Task } from '../domain/task/task.schema.js';
import type { ContextArtifact } from '../domain/evidence/context-artifact.schema.js';
import { traceSchema, type Trace } from '../domain/trace/trace.schema.js';
import { createIsolatedWorkspace, FixtureNotFoundError } from './workspace.js';

/** Resolves to the repository root, matching the pattern in src/benchmark/loadTasks.ts. */
export function defaultRepoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..');
}

export interface OnBeforeCleanupArgs {
  readonly workspacePath: string;
  readonly runId: RunId;
}

export interface HarnessDependencies {
  readonly agent: Agent;
  readonly contextProvider: ContextProvider;
  /**
   * Optional Phase-4 extension point: invoked with the (possibly agent-modified) workspace
   * path after the agent finishes and before the workspace is cleaned up — lets an evaluation
   * layer run verification against the real filesystem state without this module knowing
   * anything about Verification/Outcome. Contract: MUST NOT throw — a hook that fails must
   * catch and record its own errors, since a throw here is indistinguishable from an agent
   * failure to `executeRun` and would be misattributed as AGENT_FAILURE.
   */
  readonly onBeforeCleanup?: (args: OnBeforeCleanupArgs) => Promise<void>;
}

export interface HarnessRunConfig {
  readonly experimentId: ExperimentId;
  readonly conditionId: ConditionId;
  readonly eepVersion: string;
  readonly evaluatorVersion: string;
  readonly benchmarkVersion: string;
  readonly environment: string;
  /** Base directory `task.repository.url` is resolved against. Defaults to the repo root. */
  readonly repoRoot?: string;
}

export interface HarnessRunOutcome {
  readonly run: Run;
  readonly trace: Trace;
  /** The full context payload handed to the agent, when a workspace was available — Phase 5 metrics read this for context-cost measurement without re-deriving it from the Trace's `contextArtifactId`. */
  readonly contextArtifact?: ContextArtifact;
}

/**
 * Executes one Task under one Condition end-to-end — isolate the fixture, hand it to the
 * context provider then the agent, and capture the full Trace — see
 * project-memory-bank/04-architecture.md §Layering and 13-roadmap.md Phase 3. Never throws for
 * an expected failure mode (missing fixture, adapter error): those are recorded as an explicit
 * RunStatus on the Trace instead, per the failure taxonomy in 06-evaluation-methodology.md.
 */
export async function executeRun(
  task: Task,
  deps: HarnessDependencies,
  config: HarnessRunConfig,
): Promise<HarnessRunOutcome> {
  const runId = generateId<'RunId'>('run');
  const startedAt = new Date().toISOString();
  const fixturePath = resolve(config.repoRoot ?? defaultRepoRoot(), task.repository.url);

  let agentReportedStatus: RunStatus;
  let actions: Trace['actions'] = [];
  let decisions: Trace['decisions'] = [];
  let contextArtifactId: string | undefined;
  let contextArtifact: ContextArtifact | undefined;

  const workspace = await createIsolatedWorkspace(fixturePath).catch((error: unknown) => {
    if (error instanceof FixtureNotFoundError) return undefined;
    throw error;
  });

  if (!workspace) {
    agentReportedStatus = 'ENVIRONMENT_FAILURE';
  } else {
    try {
      const contextResult = await deps.contextProvider.provideContext({
        runId,
        task,
        repositoryPath: workspace.path,
      });
      contextArtifactId = contextResult.contextArtifact.id;
      contextArtifact = contextResult.contextArtifact;

      const agentResult = await deps.agent.run({
        runId,
        task,
        repositoryPath: workspace.path,
        contextArtifact: contextResult.contextArtifact,
      });

      agentReportedStatus = agentResult.status;
      actions = agentResult.actions;
      decisions = agentResult.decisions;

      if (deps.onBeforeCleanup) {
        await deps.onBeforeCleanup({ workspacePath: workspace.path, runId });
      }
    } catch {
      agentReportedStatus = 'AGENT_FAILURE';
    } finally {
      await workspace.cleanup();
    }
  }

  const endedAt = new Date().toISOString();

  const trace = traceSchema.parse({
    schemaVersion: '1.0.0',
    id: generateId<'TraceId'>('trace'),
    runId,
    contextArtifactId,
    actions,
    decisions,
    retries: 0,
    redactionApplied: false,
    agentReportedStatus,
    startedAt,
    endedAt,
  });

  const run = runSchema.parse({
    schemaVersion: '1.0.0',
    id: runId,
    experimentId: config.experimentId,
    conditionId: config.conditionId,
    taskId: task.id,
    metadata: {
      taskVersion: task.taskVersion,
      repositorySha: task.repository.commitSha,
      agentName: deps.agent.name,
      agentVersion: deps.agent.version,
      contextProviderName: deps.contextProvider.name,
      contextProviderVersion: deps.contextProvider.version,
      eepVersion: config.eepVersion,
      evaluatorVersion: config.evaluatorVersion,
      benchmarkVersion: config.benchmarkVersion,
      environment: config.environment,
    },
    traceId: trace.id,
    startedAt,
    finishedAt: endedAt,
  });

  return { run, trace, contextArtifact };
}
