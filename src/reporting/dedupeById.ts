/**
 * Collapses a list of records sharing an `id` field down to one entry per id, keeping the
 * first occurrence. Multiple `RunResultBundle`s can legitimately reference the same underlying
 * record (e.g. two runs sharing one `Evidence` item is not expected today, but nothing prevents
 * it) — a `ReportGraph` must not carry duplicate entries for the same entity.
 */
export function dedupeById<T extends { readonly id: string }>(records: readonly T[]): T[] {
  const seen = new Map<string, T>();
  for (const record of records) {
    if (!seen.has(record.id)) {
      seen.set(record.id, record);
    }
  }
  return [...seen.values()];
}
