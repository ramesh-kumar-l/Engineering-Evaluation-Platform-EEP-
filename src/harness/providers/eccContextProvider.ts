import { generateId } from '../../domain/common/idGenerator.js';
import type {
  ContextProvider,
  ContextProviderRequest,
  ContextProviderResult,
} from '../../domain/providers/context-provider.js';
import { estimateTokenCount } from '../../metrics/estimateTokens.js';
import { ProcessEccCliInvoker, type EccCliInvoker, type EccCliInvokerOptions } from './eccCliInvoker.js';
import { fetchValidatedEccPackage } from './eccPackageFetcher.js';

export const ECC_CONTEXT_PROVIDER_NAME = 'ecc';
export const ECC_CONTEXT_PROVIDER_VERSION = '1.0.0';

export interface EccContextProviderOptions extends EccCliInvokerOptions {
  /** Inject a fake invoker for tests; production code should leave this unset. */
  readonly invoker?: EccCliInvoker;
}

/**
 * Condition B/C's curated context source (project-memory-bank/09-experiment-strategy.md): wraps
 * ECC's published CLI contract only — `ecc context "<task>" --path <dir>` producing an
 * `EngineeringContextPackage` JSON document — never ECC's internal modules, per
 * project-memory-bank/00-project-charter.md's repository boundary rule. Output is validated
 * against EEP's own independent schema mirror (eccPackageSchema.ts) before being trusted; the
 * full validated, pretty-printed package becomes the ContextArtifact's content, i.e. exactly
 * what a real integration would hand to a consuming agent.
 */
export class EccContextProvider implements ContextProvider {
  readonly name = ECC_CONTEXT_PROVIDER_NAME;
  readonly version = ECC_CONTEXT_PROVIDER_VERSION;

  private readonly invoker: EccCliInvoker;

  constructor(options: EccContextProviderOptions = {}) {
    this.invoker = options.invoker ?? new ProcessEccCliInvoker(options);
  }

  async provideContext(request: ContextProviderRequest): Promise<ContextProviderResult> {
    const pkg = await fetchValidatedEccPackage(
      this.invoker,
      request.repositoryPath,
      request.task.description,
    );
    const content = JSON.stringify(pkg, null, 2);

    return {
      contextArtifact: {
        schemaVersion: '1.0.0',
        id: generateId<'ContextArtifactId'>('ctxart'),
        runId: request.runId,
        providerName: this.name,
        providerVersion: this.version,
        content,
        tokenCount: estimateTokenCount(content),
        redacted: false,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
