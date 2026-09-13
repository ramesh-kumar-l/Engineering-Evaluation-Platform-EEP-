import { generateId } from '../../domain/common/idGenerator.js';
import type { Agent, AgentRunRequest, AgentRunResult } from '../../domain/providers/agent.js';
import type { Action } from '../../domain/trace/action.schema.js';
import type { Decision } from '../../domain/trace/decision.schema.js';
import { listFilesRecursive } from '../support/listFiles.js';

export const NATIVE_AGENT_NAME = 'native';
export const NATIVE_AGENT_VERSION = '1.0.0';

/**
 * Deterministic baseline agent: explores the repository file tree and stops — it performs no
 * code generation or fixes. Its job is to prove the `Agent` contract and the harness execution
 * path end-to-end (Phase 3, project-memory-bank/13-roadmap.md); a real solving strategy (an LLM
 * coding agent) is later work. Always reports `INCOMPLETE`, never `SUCCESS` — reporting success
 * for work it never attempted would misrepresent the run.
 */
export class NativeAgent implements Agent {
  readonly name = NATIVE_AGENT_NAME;
  readonly version = NATIVE_AGENT_VERSION;

  async run(request: AgentRunRequest): Promise<AgentRunResult> {
    const files = await listFilesRecursive(request.repositoryPath);
    const timestamp = new Date().toISOString();

    const actions: Action[] = files.map((file) => ({
      schemaVersion: '1.0.0',
      id: generateId<'ActionId'>('action'),
      runId: request.runId,
      type: 'file-read',
      target: file,
      timestamp,
    }));

    const decisions: Decision[] = [
      {
        schemaVersion: '1.0.0',
        id: generateId<'DecisionId'>('decision'),
        runId: request.runId,
        description:
          'Explored the repository file tree; this baseline agent performs no automated code changes.',
        alternativesConsidered: [],
        rationale:
          'NativeAgent proves the harness end-to-end (Phase 3); a real solving strategy is a future agent implementation.',
        timestamp,
      },
    ];

    return { status: 'INCOMPLETE', actions, decisions };
  }
}
