import { describe, expect, it } from 'vitest';
import { groupBy } from './groupBy.js';

describe('groupBy', () => {
  it('groups items by the derived key, preserving item order within each group', () => {
    const items = [
      { id: 1, kind: 'a' },
      { id: 2, kind: 'b' },
      { id: 3, kind: 'a' },
    ];
    const groups = groupBy(items, (item) => item.kind);
    expect([...groups.keys()]).toEqual(['a', 'b']);
    expect(groups.get('a')).toEqual([items[0], items[2]]);
    expect(groups.get('b')).toEqual([items[1]]);
  });

  it('returns an empty map for an empty input', () => {
    expect(groupBy([], (item: never) => item).size).toBe(0);
  });
});
