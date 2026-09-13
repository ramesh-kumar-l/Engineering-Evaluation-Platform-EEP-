import { generateId } from '../../domain/common/idGenerator.js';
import type {
  ContextProvider,
  ContextProviderRequest,
  ContextProviderResult,
} from '../../domain/providers/context-provider.js';
import { listFilesRecursive } from '../support/listFiles.js';

export const NATIVE_CONTEXT_PROVIDER_NAME = 'native';
export const NATIVE_CONTEXT_PROVIDER_VERSION = '1.0.0';

/**
 * The "no curated context" baseline: hands the agent only the task text and a plain repository
 * file listing, matching Condition A ("Native Agent") in
 * project-memory-bank/09-experiment-strategy.md. ECC's richer, curated context (Phase 6)
 * implements this same ContextProvider contract with real retrieval logic.
 */
export class NativeContextProvider implements ContextProvider {
  readonly name = NATIVE_CONTEXT_PROVIDER_NAME;
  readonly version = NATIVE_CONTEXT_PROVIDER_VERSION;

  async provideContext(request: ContextProviderRequest): Promise<ContextProviderResult> {
    const files = await listFilesRecursive(request.repositoryPath);
    const content = [
      `Task: ${request.task.title}`,
      '',
      request.task.description,
      '',
      'Repository files:',
      ...files.map((file) => `- ${file}`),
    ].join('\n');

    return {
      contextArtifact: {
        schemaVersion: '1.0.0',
        id: generateId<'ContextArtifactId'>('ctxart'),
        runId: request.runId,
        providerName: this.name,
        providerVersion: this.version,
        content,
        redacted: false,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
