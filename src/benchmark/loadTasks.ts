import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taskSchema, type Task } from '../domain/index.js';

/**
 * Resolves to <repo-root>/benchmark/tasks regardless of whether this module is
 * running from src/ (vitest, ts-node) or dist/ (compiled) — both sit one
 * directory deeper than the repo root under their respective roots.
 */
export function defaultTasksDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'benchmark', 'tasks');
}

export class TaskValidationError extends Error {
  constructor(
    public readonly filePath: string,
    cause: unknown,
  ) {
    super(`Invalid task file: ${filePath}\n${String(cause)}`);
    this.name = 'TaskValidationError';
  }
}

/** Loads and validates every *.json task file in `dir` (default: benchmark/tasks/). */
export function loadAllTasks(dir: string = defaultTasksDir()): Task[] {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const filePath = join(dir, file);
    const raw: unknown = JSON.parse(readFileSync(filePath, 'utf-8'));
    const result = taskSchema.safeParse(raw);
    if (!result.success) {
      throw new TaskValidationError(filePath, result.error);
    }
    return result.data;
  });
}
