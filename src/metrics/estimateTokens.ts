/**
 * Rough token estimate (~4 chars/token, a common approximation for English/code text), used only
 * when a ContextProvider does not report a real `tokenCount` on its ContextArtifact — see
 * project-memory-bank/08-metrics.md. Never overrides a provider-reported count; it exists so
 * context-cost metrics stay computable even for providers (like NativeContextProvider) that don't
 * measure tokens themselves.
 */
export function estimateTokenCount(content: string): number {
  return Math.ceil(content.length / 4);
}
