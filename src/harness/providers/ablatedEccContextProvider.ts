import { generateId } from '../../domain/common/idGenerator.js';
import type {
  ContextProvider,
  ContextProviderRequest,
  ContextProviderResult,
} from '../../domain/providers/context-provider.js';
import { estimateTokenCount } from '../../metrics/estimateTokens.js';
import { ProcessEccCliInvoker, type EccCliInvoker, type EccCliInvokerOptions } from './eccCliInvoker.js';
import { fetchValidatedEccPackage } from './eccPackageFetcher.js';
import { ablatePackage, ablatedConditionName, type EccAblationComponent } from './eccAblation.js';

export const ECC_ABLATED_PROVIDER_VERSION = '1.0.0';

export interface AblatedEccContextProviderOptions extends EccCliInvokerOptions {
  /** Inject a fake invoker for tests; production code should leave this unset. */
  readonly invoker?: EccCliInvoker;
}

/**
 * Phase 8 (Ablation): wraps the same ECC CLI contract as EccContextProvider (Phase 6, ADR-010)
 * but removes exactly one named component (eccAblation.ts) from the resulting package before it
 * becomes a ContextArtifact — see ADR-012 in project-memory-bank/14-decisions.md. Instantiate one
 * per component to create that component's ablation Condition
 * (project-memory-bank/09-experiment-strategy.md): task, repository state, model, tools, and
 * agent all stay identical to the full-ECC condition, so any observed difference in outcomes
 * isolates that one component's marginal contribution.
 */
export class AblatedEccContextProvider implements ContextProvider {
  readonly name: string;
  readonly version = ECC_ABLATED_PROVIDER_VERSION;

  private readonly invoker: EccCliInvoker;
  private readonly component: EccAblationComponent;

  constructor(component: EccAblationComponent, options: AblatedEccContextProviderOptions = {}) {
    this.component = component;
    this.name = ablatedConditionName(component);
    this.invoker = options.invoker ?? new ProcessEccCliInvoker(options);
  }

  async provideContext(request: ContextProviderRequest): Promise<ContextProviderResult> {
    const fullPackage = await fetchValidatedEccPackage(
      this.invoker,
      request.repositoryPath,
      request.task.description,
    );
    const ablated = ablatePackage(fullPackage, this.component);
    const content = JSON.stringify(ablated, null, 2);

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
