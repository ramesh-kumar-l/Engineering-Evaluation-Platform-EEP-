import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExperimentId } from '../domain/common/ids.js';
import type { ReportGraph } from './reportGraph.js';

export function defaultReportsDir(): string {
  return join(process.cwd(), 'reports');
}

/**
 * Writes one experiment's canonical `ReportGraph` to `<reportsDir>/<experimentId>/report.json` —
 * the Phase 9 persistence format, distinct from `src/experiments/resultsWriter.ts`'s per-run
 * `experiment-results/` dump (that dump remains a crash-safe write-ahead record captured while a
 * live comparison run is still in progress; this file is the one canonical, self-contained,
 * citable artifact a report reader/dashboard should ever need — see `buildReport.ts`). One file
 * per experiment, not one per run: unlike raw per-run bundles, a Report only makes sense as a
 * whole aggregate.
 */
export async function writeReport(
  graph: ReportGraph,
  reportsDir: string = defaultReportsDir(),
): Promise<string> {
  const dir = join(reportsDir, graph.report.experimentId);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, 'report.json');
  await writeFile(filePath, JSON.stringify(graph, null, 2), 'utf-8');
  return filePath;
}

/** Reads back a previously written `ReportGraph` for one experiment. */
export async function readReport(
  experimentId: ExperimentId,
  reportsDir: string = defaultReportsDir(),
): Promise<ReportGraph> {
  const filePath = join(reportsDir, experimentId, 'report.json');
  return JSON.parse(await readFile(filePath, 'utf-8')) as ReportGraph;
}

/**
 * Finds the most recently written experiment subdirectory under `reportsDir`, for callers (the
 * Phase 10 dashboard generator) that don't specify which report to read. Mirrors
 * `src/experiments/resultsWriter.ts`'s `latestExperimentId()` exactly, but scans `reports/`
 * rather than `experiment-results/` — kept as its own small implementation rather than a shared
 * cross-layer helper, since `src/reporting/` and `src/experiments/` are deliberately decoupled
 * (ADR-011/ADR-014).
 */
export async function latestReportedExperimentId(reportsDir: string = defaultReportsDir()): Promise<ExperimentId> {
  const entries = await readdir(reportsDir, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter((entry) => entry.isDirectory());
  if (dirs.length === 0) {
    throw new Error(`No reports found under ${reportsDir}`);
  }
  const withMtime = await Promise.all(
    dirs.map(async (entry) => ({
      name: entry.name,
      mtimeMs: (await stat(join(reportsDir, entry.name))).mtimeMs,
    })),
  );
  withMtime.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return withMtime[0]!.name as ExperimentId;
}
