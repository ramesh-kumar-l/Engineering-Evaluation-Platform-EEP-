import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import type { ContextArtifact } from '../domain/evidence/context-artifact.schema.js';
import type { Evidence } from '../domain/evidence/evidence.schema.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { TaskCategory, TaskComplexity } from '../domain/task/task.schema.js';
import type { Trace } from '../domain/trace/trace.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';

/**
 * One run's full raw bundle, dumped as-is to `experiment-results/`. Phase 9's canonical
 * Report/persistence format doesn't exist yet (project-memory-bank/13-roadmap.md), so this is
 * deliberately a plain data dump this project makes no long-term schema commitment to — it exists
 * only to let `analyzeComparisonResults.ts` reconstruct `RunAnalysisRecord[]` without re-deriving
 * anything from a live run.
 */
export interface RunResultBundle {
  readonly conditionName: string;
  readonly taskId: string;
  readonly taskCategory: TaskCategory;
  readonly taskComplexity: TaskComplexity;
  readonly run: Run;
  readonly trace: Trace;
  readonly outcome: Outcome;
  readonly verifications: readonly Verification[];
  readonly evidence: readonly Evidence[];
  readonly metrics: readonly Metric[];
  readonly contextArtifact?: ContextArtifact;
}

export function defaultResultsDir(): string {
  return join(process.cwd(), 'experiment-results');
}

/** Writes one run's bundle to `<resultsDir>/<experimentId>/<runId>.json`, creating directories as needed. */
export async function writeRunResult(
  bundle: RunResultBundle,
  experimentId: ExperimentId,
  runId: RunId,
  resultsDir: string = defaultResultsDir(),
): Promise<string> {
  const dir = join(resultsDir, experimentId);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, `${runId}.json`);
  await writeFile(filePath, JSON.stringify(bundle, null, 2), 'utf-8');
  return filePath;
}

/** Reads back every run bundle written for one experiment; returns an empty array if none exist. */
export async function readAllRunResults(
  experimentId: ExperimentId,
  resultsDir: string = defaultResultsDir(),
): Promise<RunResultBundle[]> {
  const dir = join(resultsDir, experimentId);
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }

  return Promise.all(
    files.map(async (file) => JSON.parse(await readFile(join(dir, file), 'utf-8')) as RunResultBundle),
  );
}
