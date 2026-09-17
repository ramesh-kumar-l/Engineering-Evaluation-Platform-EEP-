import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
