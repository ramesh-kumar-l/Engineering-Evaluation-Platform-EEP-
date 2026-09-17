import { generateId } from '../domain/common/idGenerator.js';
import { conditionSchema, type Condition } from '../domain/experiment/condition.schema.js';
import type { ContextProvider } from '../domain/providers/context-provider.js';
import { AblatedEccContextProvider } from '../harness/providers/ablatedEccContextProvider.js';
import type { EccCliInvokerOptions } from '../harness/providers/eccCliInvoker.js';
import { ablatedConditionName, ECC_ABLATION_COMPONENTS } from '../harness/providers/eccAblation.js';
import { EccContextProvider } from '../harness/providers/eccContextProvider.js';
import { NativeContextProvider } from '../harness/providers/nativeContextProvider.js';

export interface ExperimentConditionEntry {
  readonly condition: Condition;
  readonly contextProvider: ContextProvider;
}

function buildCondition(name: string, description: string, provider: ContextProvider): Condition {
  return conditionSchema.parse({
    schemaVersion: '1.0.0',
    id: generateId<'ConditionId'>('condition'),
    name,
    description,
    contextProviderName: provider.name,
    contextProviderVersion: provider.version,
    isOracle: false,
  });
}

/**
 * Builds the 9 real comparison conditions — 1 native baseline + 1 full-ECC + 7 per-component
 * ablations. Every condition is later paired with the *same* solving agent
 * (`runComparisonExperiment.ts`); only the `ContextProvider` varies here, matching
 * project-memory-bank/09-experiment-strategy.md's causal-isolation principle ("the only varying
 * dimension is the ContextProvider"). None is an oracle condition, so `isOracle` is always false.
 * `eccOptions` is shared by every ECC-backed provider so they all invoke the same configured
 * `ecc` CLI.
 */
export function buildExperimentConditions(
  eccOptions: EccCliInvokerOptions = {},
): ExperimentConditionEntry[] {
  const nativeProvider = new NativeContextProvider();
  const eccProvider = new EccContextProvider(eccOptions);

  const entries: ExperimentConditionEntry[] = [
    {
      condition: buildCondition('native', 'No curated context (baseline).', nativeProvider),
      contextProvider: nativeProvider,
    },
    {
      condition: buildCondition('ecc', 'Full ECC-curated context.', eccProvider),
      contextProvider: eccProvider,
    },
  ];

  for (const component of ECC_ABLATION_COMPONENTS) {
    const provider = new AblatedEccContextProvider(component, eccOptions);
    entries.push({
      condition: buildCondition(
        ablatedConditionName(component),
        `Full ECC context with the "${component}" component removed.`,
        provider,
      ),
      contextProvider: provider,
    });
  }

  return entries;
}
