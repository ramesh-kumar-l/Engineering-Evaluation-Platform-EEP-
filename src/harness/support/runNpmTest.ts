import { spawn } from 'node:child_process';

export interface SpawnOutcome {
  readonly exitCode: number | null;
  readonly output: string;
  readonly timedOut: boolean;
}

/** Thrown when `npm test` itself could not be spawned (e.g. npm missing from PATH) — distinct from the test suite running and failing. */
export class RunNpmTestSpawnError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RunNpmTestSpawnError';
  }
}

/**
 * Spawns the fixture's own `npm test` inside `cwd` and captures its combined stdout/stderr, exit
 * code, and whether it was killed for exceeding `timeoutMs`. Extracted from the original
 * `testSuiteVerifier.ts` (Phase 4) so it can be shared, unchanged, by both that verifier
 * (`src/evaluation/verifiers/testSuiteVerifier.ts`) and the solving agent's `run_tests` tool
 * (`src/harness/agents/llmAgentTools.ts`) — both run the exact same fixed, non-shell-injectable
 * command, never an arbitrary agent-supplied string. See project-memory-bank/16-risks.md's
 * "untrusted generated commands" risk row. Deliberately has no dependency on `src/evaluation/`:
 * `evaluation/` depends on `harness/`, never the reverse.
 */
export function runNpmTest(cwd: string, timeoutMs: number): Promise<SpawnOutcome> {
  return new Promise((resolvePromise, reject) => {
    // Fixed, hardcoded command (no task/agent-controlled input reaches this string), so
    // shell:true is safe here; passing it as a single string with no `args` avoids Node's
    // DEP0190 warning, which only applies when `args` are concatenated into a shell command.
    const child = spawn('npm test', [], { cwd, shell: true, windowsHide: true });
    let output = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new RunNpmTestSpawnError('Failed to spawn npm test', error));
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolvePromise({ exitCode, output, timedOut });
    });
  });
}
