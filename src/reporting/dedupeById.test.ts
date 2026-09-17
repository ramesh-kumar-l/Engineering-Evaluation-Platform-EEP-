import { describe, expect, it } from 'vitest';
import { dedupeById } from './dedupeById.js';

describe('dedupeById', () => {
  it('keeps only the first occurrence of each id', () => {
    const result = dedupeById([
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
      { id: 'a', value: 99 },
    ]);
    expect(result).toEqual([
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(dedupeById([])).toEqual([]);
  });
});
