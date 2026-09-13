import { describe, expect, it } from 'vitest';
import { estimateTokenCount } from './estimateTokens.js';

describe('estimateTokenCount', () => {
  it('estimates roughly one token per four characters, rounded up', () => {
    expect(estimateTokenCount('abcd')).toBe(1);
    expect(estimateTokenCount('abcde')).toBe(2);
  });

  it('returns 0 for empty content', () => {
    expect(estimateTokenCount('')).toBe(0);
  });
});
