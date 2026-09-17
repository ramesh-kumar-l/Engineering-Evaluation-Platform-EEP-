import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import type { LlmToolDefinition } from '../llm/llmClient.types.js';
import { listFilesRecursive } from '../support/listFiles.js';
import { runNpmTest } from '../support/runNpmTest.js';

const RUN_TESTS_TIMEOUT_MS = 30_000;
const MAX_TOOL_RESULT_CHARS = 8_000;

/**
 * The solving agent's entire tool surface — deliberately narrow. No generic shell-exec tool is
 * exposed to the model at all: `list_files`/`read_file`/`write_file` are path-clamped to the
 * workspace root (model-supplied arguments are untrusted input), and `run_tests` always runs the
 * fixture's own fixed `npm test` (via the same `runNpmTest` the test-suite verifier uses), never
 * an arbitrary model-supplied command string. Addresses the "revisit before any agent executes
 * untrusted generated commands" risk in project-memory-bank/16-risks.md.
 */
export const LLM_AGENT_TOOLS: readonly LlmToolDefinition[] = [
  {
    name: 'list_files',
    description: 'List files in the repository, relative to its root.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'read_file',
    description: 'Read the full contents of one file, given a path relative to the repository root.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Path relative to the repository root.' } },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    name: 'write_file',
    description:
      'Create or overwrite one file with the given content, given a path relative to the repository root.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path relative to the repository root.' },
        content: { type: 'string', description: 'The full new file content.' },
      },
      required: ['path', 'content'],
      additionalProperties: false,
    },
  },
  {
    name: 'run_tests',
    description: "Run the repository's own test suite (npm test) and report its output.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

/** Thrown when a tool call's `path` argument would resolve outside the workspace root. */
export class ToolPathEscapeError extends Error {
  constructor(readonly requestedPath: string) {
    super(`Path escapes the workspace root: ${requestedPath}`);
    this.name = 'ToolPathEscapeError';
  }
}

/**
 * Resolves a model-supplied relative path against `workspaceRoot`, rejecting anything that
 * escapes it (absolute paths, `..` traversal, symlink-free path climbing). Every filesystem tool
 * goes through this — tool-call arguments come from model output and must be treated as
 * untrusted, exactly like any other external input.
 */
export function resolveWorkspacePath(workspaceRoot: string, requestedPath: string): string {
  if (isAbsolute(requestedPath)) {
    throw new ToolPathEscapeError(requestedPath);
  }
  const root = resolve(workspaceRoot);
  const resolved = resolve(root, requestedPath);
  const rel = relative(root, resolved);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new ToolPathEscapeError(requestedPath);
  }
  return resolved;
}

function truncate(text: string): string {
  return text.length > MAX_TOOL_RESULT_CHARS ? `${text.slice(0, MAX_TOOL_RESULT_CHARS)}\n...[truncated]` : text;
}

/**
 * Executes one tool call against the isolated workspace and returns the text to feed back to the
 * model. Never throws for an expected failure (bad path, missing file, failing tests) — those
 * become a descriptive error string the model can react to; only truly unexpected errors escape,
 * which `llmSolvingAgent.ts`'s turn loop catches at a higher level.
 */
export async function executeAgentTool(
  workspaceRoot: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<string> {
  try {
    switch (toolName) {
      case 'list_files': {
        const files = await listFilesRecursive(workspaceRoot);
        return files.join('\n');
      }
      case 'read_file': {
        const path = resolveWorkspacePath(workspaceRoot, String(args.path ?? ''));
        return truncate(await readFile(path, 'utf-8'));
      }
      case 'write_file': {
        const path = resolveWorkspacePath(workspaceRoot, String(args.path ?? ''));
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, String(args.content ?? ''), 'utf-8');
        return `Wrote ${String(args.path)}`;
      }
      case 'run_tests': {
        const { exitCode, output, timedOut } = await runNpmTest(workspaceRoot, RUN_TESTS_TIMEOUT_MS);
        if (timedOut) return `npm test timed out after ${RUN_TESTS_TIMEOUT_MS}ms`;
        return truncate(`Exit code ${String(exitCode)}\n${output}`);
      }
      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    if (error instanceof ToolPathEscapeError) {
      return `Error: ${error.message}`;
    }
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
