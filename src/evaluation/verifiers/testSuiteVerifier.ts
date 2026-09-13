import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateId } from '../../domain/common/idGenerator.js';
import { isoTimestampSchema } from '../../domain/common/timestamps.js';
import { evidenceSchema } from '../../domain/evidence/evidence.schema.js';
import { verificationSchema } from '../../domain/verification/verification.schema.js';
import {
  VerificationExecutionError,
  VerificationTimeoutError,
  type Verifier,
  type VerifierContext,
  type VerifierResult,
} from './verifier.types.js';

const DEFAULT_TIMEOUT_MS = 15_000;

interface SpawnOutcome {
  readonly exitCode: number | null;
  readonly output: string;
  readonly timedOut: boolean;
}

function runNpmTest(cwd: string, timeoutMs: number): Promise<SpawnOutcome> {
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
      reject(new VerificationExecutionError('Failed to spawn npm test', error));
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolvePromise({ exitCode, output, timedOut });
    });
  });
}

/**
 * Runs the fixture's own `npm test` inside the isolated workspace and reports pass/fail — see
 * project-memory-bank/06-evaluation-methodology.md. Throws (rather than reporting `passed:
 * false`) when the check itself could not run at all, so that gets classified as
 * EVALUATION_FAILURE, never TASK_FAILURE — see [[../determineOutcome]].
 */
export const testSuiteVerifier: Verifier = {
  method: 'test-suite',

  appliesTo(task) {
    return task.verificationMethod.toLowerCase().includes('test-suite');
  },

  async run(context: VerifierContext): Promise<VerifierResult> {
    const packageJsonPath = join(context.workspacePath, 'package.json');
    let hasTestScript = false;
    try {
      const raw = await readFile(packageJsonPath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      hasTestScript =
        typeof parsed === 'object' &&
        parsed !== null &&
        'scripts' in parsed &&
        typeof (parsed as { scripts?: unknown }).scripts === 'object' &&
        (parsed as { scripts: Record<string, unknown> }).scripts !== null &&
        typeof (parsed as { scripts: Record<string, unknown> }).scripts.test === 'string';
    } catch (error) {
      throw new VerificationExecutionError(
        `Fixture has no readable package.json at ${packageJsonPath}`,
        error,
      );
    }

    if (!hasTestScript) {
      throw new VerificationExecutionError(
        `Fixture package.json has no "test" script; cannot run test-suite verification`,
      );
    }

    const { exitCode, output, timedOut } = await runNpmTest(
      context.workspacePath,
      DEFAULT_TIMEOUT_MS,
    );

    if (timedOut) {
      throw new VerificationTimeoutError(
        `npm test exceeded ${DEFAULT_TIMEOUT_MS}ms in ${context.workspacePath}`,
      );
    }

    const timestamp = isoTimestampSchema.parse(new Date().toISOString());
    const evidence = [
      evidenceSchema.parse({
        schemaVersion: '1.0.0',
        id: generateId<'EvidenceId'>('evidence'),
        kind: 'test-result',
        description: `npm test output (exit code ${String(exitCode)})`,
        source: 'test-suite-verifier',
        content: output.slice(0, 8000),
        createdAt: timestamp,
      }),
    ];

    const verification = verificationSchema.parse({
      schemaVersion: '1.0.0',
      id: generateId<'VerificationId'>('verification'),
      runId: context.runId,
      method: 'test-suite',
      passed: exitCode === 0,
      detail: exitCode === 0 ? 'npm test exited 0' : `npm test exited ${String(exitCode)}`,
      evidenceIds: evidence.map((e) => e.id),
      timestamp,
    });

    return { verification, evidence };
  },
};
