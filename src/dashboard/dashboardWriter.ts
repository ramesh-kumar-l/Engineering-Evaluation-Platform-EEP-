import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReportGraph } from '../reporting/reportGraph.js';
import { renderDashboardPage } from './renderDashboardPage.js';

export function defaultDashboardDir(): string {
  return join(process.cwd(), 'dashboard');
}

/**
 * Renders one experiment's `ReportGraph` and writes it to
 * `<dashboardDir>/<experimentId>/index.html` — a static file the user opens directly in a
 * browser, gitignored and parallel to `reports/`. No dev server, no build step: this is the
 * entire Phase 10 MVP delivery mechanism.
 */
export async function writeDashboard(graph: ReportGraph, dashboardDir: string = defaultDashboardDir()): Promise<string> {
  const dir = join(dashboardDir, graph.report.experimentId);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, 'index.html');
  await writeFile(filePath, renderDashboardPage(graph), 'utf-8');
  return filePath;
}
