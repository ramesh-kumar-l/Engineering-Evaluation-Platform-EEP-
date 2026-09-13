import { execFile } from 'node:child_process';

const DEFAULT_COMMAND = 'ecc';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_BUFFER_BYTES = 10 * 1024 * 1024;

export interface EccCliInvokerOptions {
  /** Executable to run. Default: `ECC_CLI_COMMAND` env var, else `"ecc"` (assumes a PATH link). */
  readonly command?: string;
  /** Args prepended before `context <request> --path <dir>`, e.g. `["<dist>/cli/index.js"]` when `command` is `"node"`. */
  readonly commandArgs?: readonly string[];
  readonly tokenBudget?: number;
  readonly timeoutMs?: number;
  readonly maxBufferBytes?: number;
}

/** Thrown when the ECC CLI could not be run or exited with a failure. */
export class EccInvocationError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'EccInvocationError';
  }
}

/** Thrown when the ECC CLI exceeded its allotted time budget. */
export class EccTimeoutError extends EccInvocationError {
  constructor(message: string) {
    super(message);
    this.name = 'EccTimeoutError';
  }
}

/** Abstraction over "run ECC and get its stdout" — lets EccContextProvider be tested without a real subprocess. */
export interface EccCliInvoker {
  invoke(repositoryPath: string, request: string): Promise<string>;
}

/**
 * Shells out to ECC's own published CLI contract (`ecc context "<task>" --path <dir> [--budget
 * <n>]`, documented in ECC's README) — EEP's only integration point with ECC, per
 * project-memory-bank/00-project-charter.md's repository boundary rule. Never imports ECC
 * source; which command actually runs is fully configurable so a deployment can point at a
 * global `ecc` link or `node <path-to-ecc-checkout>/dist/cli/index.js` without any EEP code
 * change. Uses array-argument `execFile` (never shell string interpolation), matching ECC's own
 * documented security posture, so a task description containing shell metacharacters can never
 * be interpreted as a second command.
 */
export class ProcessEccCliInvoker implements EccCliInvoker {
  private readonly command: string;
  private readonly commandArgs: readonly string[];
  private readonly tokenBudget?: number;
  private readonly timeoutMs: number;
  private readonly maxBufferBytes: number;

  constructor(options: EccCliInvokerOptions = {}) {
    this.command = options.command ?? process.env.ECC_CLI_COMMAND ?? DEFAULT_COMMAND;
    this.commandArgs = options.commandArgs ?? [];
    this.tokenBudget = options.tokenBudget;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxBufferBytes = options.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES;
  }

  invoke(repositoryPath: string, request: string): Promise<string> {
    const args = [
      ...this.commandArgs,
      'context',
      request,
      '--path',
      repositoryPath,
      ...(this.tokenBudget !== undefined ? ['--budget', String(this.tokenBudget)] : []),
    ];

    return new Promise((resolvePromise, reject) => {
      execFile(
        this.command,
        args,
        { timeout: this.timeoutMs, maxBuffer: this.maxBufferBytes, windowsHide: true },
        (error, stdout, stderr) => {
          if (error) {
            if (error.killed || error.signal) {
              reject(new EccTimeoutError(`ECC CLI exceeded ${String(this.timeoutMs)}ms`));
              return;
            }
            reject(
              new EccInvocationError(
                `ECC CLI invocation failed: ${error.message}` +
                  (stderr ? ` (stderr: ${stderr.slice(0, 2000)})` : ''),
                error,
              ),
            );
            return;
          }
          resolvePromise(stdout);
        },
      );
    });
  }
}
