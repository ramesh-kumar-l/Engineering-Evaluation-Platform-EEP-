import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
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
 * One run's full raw bundle, dumped as-is to `experiment-results/` while a comparison run is
 * still in progress — a crash-safe write-ahead record, not the canonical output. Phase 9's
 * canonical, schema-validated persistence format is `src/reporting/`'s `ReportGraph`
 * (`generateReport.ts` reads these bundles back and turns them into one); this dump remains
 * deliberately loose (no schema commitment) since it exists only so `analyzeComparisonResults.ts`
 * and `generateReport.ts` can reconstruct their own typed records without re-deriving anything
 * from a live run.
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

/**
 * Finds the most recently written experiment subdirectory under `resultsDir`, for callers that
 * don't specify which experiment to read — shared by `analyzeComparisonResults.ts` and
 * `generateReport.ts` rather than duplicated in each.
 */
export async function latestExperimentId(resultsDir: string = defaultResultsDir()): Promise<ExperimentId> {
  const entries = await readdir(resultsDir, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter((entry) => entry.isDirectory());
  if (dirs.length === 0) {
    throw new Error(`No experiment results found under ${resultsDir}`);
  }
  const withMtime = await Promise.all(
    dirs.map(async (entry) => ({
      name: entry.name,
      mtimeMs: (await stat(join(resultsDir, entry.name))).mtimeMs,
    })),
  );
  withMtime.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return withMtime[0]!.name as ExperimentId;
}
