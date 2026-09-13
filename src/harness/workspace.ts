import { existsSync } from 'node:fs';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';

export class FixtureNotFoundError extends Error {
  constructor(public readonly fixturePath: string) {
    super(`Fixture directory not found: ${fixturePath}`);
    this.name = 'FixtureNotFoundError';
  }
}

export interface IsolatedWorkspace {
  /** Absolute path to the sandboxed copy of the fixture; agents/providers must only touch this. */
  readonly path: string;
  cleanup(): Promise<void>;
}

/**
 * Copies a fixture repository into a fresh, disposable temp directory so a run can never
 * mutate the canonical fixture on disk — the environment-isolation boundary for Phase 3 (see
 * project-memory-bank/14-decisions.md ADR-007). Process-level sandboxing (containers) is
 * deliberately out of scope until a concrete need for it appears (ADR-004's local-first stance).
 */
export async function createIsolatedWorkspace(fixturePath: string): Promise<IsolatedWorkspace> {
  if (!existsSync(fixturePath)) {
    throw new FixtureNotFoundError(fixturePath);
  }

  const sandbox = await mkdtemp(join(tmpdir(), 'eep-run-'));
  await cp(fixturePath, sandbox, {
    recursive: true,
    filter: (src) => !src.split(sep).includes('.git'),
  });

  return {
    path: sandbox,
    cleanup: () => rm(sandbox, { recursive: true, force: true }),
  };
}
