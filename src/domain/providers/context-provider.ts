import type { ContextArtifact } from '../evidence/context-artifact.schema.js';
import type { Task } from '../task/task.schema.js';

export interface ContextProviderRequest {
  readonly task: Task;
  readonly repositoryPath: string;
}

export interface ContextProviderResult {
  readonly contextArtifact: ContextArtifact;
}

/**
 * The single contract every context source implements — native/no-op exploration, ECC, an
 * oracle/human-curated provider, or any future source (RAG, memory systems). EEP's core
 * depends only on this interface, never on a provider's internals — see
 * project-memory-bank/04-architecture.md §EEP / ECC boundary and 00-project-charter.md.
 */
export interface ContextProvider {
  readonly name: string;
  readonly version: string;
  provideContext(request: ContextProviderRequest): Promise<ContextProviderResult>;
}
