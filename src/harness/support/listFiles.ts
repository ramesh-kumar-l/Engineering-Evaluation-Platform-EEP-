import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function walk(root: string, dir: string, limit: number, acc: string[]): Promise<void> {
  if (acc.length >= limit) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (acc.length >= limit) return;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(root, full, limit, acc);
    } else {
      acc.push(relative(root, full));
    }
  }
}

/**
 * Recursively lists file paths under `dir` relative to `root`, capped at `limit` entries so a
 * pathological fixture can't blow up context size or agent step count. Shared by the native
 * context provider and native agent — see project-memory-bank/13-roadmap.md Phase 3.
 */
export async function listFilesRecursive(
  root: string,
  dir: string = root,
  limit = 200,
): Promise<string[]> {
  const acc: string[] = [];
  await walk(root, dir, limit, acc);
  return acc;
}
