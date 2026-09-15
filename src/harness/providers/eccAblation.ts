import type { EccContextPackage } from './eccPackageSchema.js';

/**
 * Phase 8 (Ablation): the named ECC components from project-memory-bank/06-evaluation-
 * methodology.md §Ablation discipline, each mapped onto a real, already-present field of ECC's
 * documented package contract — never a fabricated dimension, matching ADR-009's "only compute
 * from a real data source" discipline. See ADR-012 in project-memory-bank/14-decisions.md for the
 * full mapping rationale and its limitations.
 */
export const ECC_ABLATION_COMPONENTS = [
  'history',
  'memory',
  'ranking',
  'provenance',
  'risk',
  'budgeting',
  'verification',
] as const;

export type EccAblationComponent = (typeof ECC_ABLATION_COMPONENTS)[number];

/** Condition-name convention for one component's ablated runs, e.g. `ecc-ablated:history`. */
export function ablatedConditionName(component: EccAblationComponent): string {
  return `ecc-ablated:${component}`;
}

type EvidenceItem = EccContextPackage['context']['primary'][number];

function identityKey(item: EvidenceItem): string {
  return item.path ?? item.identifier ?? '';
}

function stripMemorySource(items: readonly EvidenceItem[]): EvidenceItem[] {
  return items.filter((item) => item.source !== 'memory');
}

function stripEvidenceProvenance(items: readonly EvidenceItem[]): EvidenceItem[] {
  return items.map((item) => ({ ...item, provenance: undefined }));
}

/**
 * Returns a copy of `pkg` with exactly one named component's contribution removed, holding every
 * other field constant — the causal-control discipline in project-memory-bank/
 * 09-experiment-strategy.md ("only varying dimension is the ContextProvider") applied one level
 * deeper, at the context *content* a single ContextProvider produces. Never mutates `pkg`.
 */
export function ablatePackage(pkg: EccContextPackage, component: EccAblationComponent): EccContextPackage {
  const clone = structuredClone(pkg);

  switch (component) {
    case 'history':
      return { ...clone, history: [] };
    case 'memory':
      return {
        ...clone,
        context: {
          primary: stripMemorySource(clone.context.primary),
          supporting: stripMemorySource(clone.context.supporting),
        },
      };
    case 'ranking': {
      const merged = [...clone.context.primary, ...clone.context.supporting].sort((a, b) =>
        identityKey(a).localeCompare(identityKey(b)),
      );
      return { ...clone, context: { primary: merged, supporting: [] } };
    }
    case 'provenance':
      return {
        ...clone,
        context: {
          primary: stripEvidenceProvenance(clone.context.primary),
          supporting: stripEvidenceProvenance(clone.context.supporting),
        },
      };
    case 'risk':
      return { ...clone, conflicts: [] };
    case 'budgeting':
      return { ...clone, excluded: [] };
    case 'verification':
      return { ...clone, verification: [] };
  }
}
