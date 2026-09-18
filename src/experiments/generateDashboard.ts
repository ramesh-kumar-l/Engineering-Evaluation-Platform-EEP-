import { pathToFileURL } from 'node:url';
import type { ExperimentId } from '../domain/common/ids.js';
import { defaultDashboardDir, writeDashboard } from '../dashboard/dashboardWriter.js';
import { defaultReportsDir, latestReportedExperimentId, readReport } from '../reporting/reportWriter.js';

export interface GenerateDashboardOptions {
  readonly reportsDir?: string;
  readonly dashboardDir?: string;
}

export interface GenerateDashboardResult {
  readonly filePath: string;
  readonly experimentId: ExperimentId;
}

/**
 * Phase 10 entry point: reads one experiment's canonical `ReportGraph`
 * (`src/reporting/reportWriter.ts`'s `readReport()`, written by `generateReport.ts`) and renders
 * it to a static dashboard HTML file (`src/dashboard/`). Mirrors `generateReport.ts`'s shape —
 * resolve an experiment id (explicit or latest), read the canonical artifact, hand it to the pure
 * rendering layer, persist the result.
 */
export async function generateDashboard(
  experimentId?: ExperimentId,
  options: GenerateDashboardOptions = {},
): Promise<GenerateDashboardResult> {
  const reportsDir = options.reportsDir ?? defaultReportsDir();
  const id = experimentId ?? (await latestReportedExperimentId(reportsDir));
  const graph = await readReport(id, reportsDir);
  const filePath = await writeDashboard(graph, options.dashboardDir ?? defaultDashboardDir());
  return { filePath, experimentId: id };
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  const experimentIdArg = process.argv[2] as ExperimentId | undefined;
  generateDashboard(experimentIdArg)
    .then(({ filePath, experimentId }) => {
      console.log(`Wrote dashboard for experiment ${experimentId} to ${filePath}`);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
