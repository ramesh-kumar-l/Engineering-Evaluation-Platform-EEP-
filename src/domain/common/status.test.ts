import { describe, expect, it } from 'vitest';
import { runStatusSchema } from './status.js';

describe('runStatusSchema', () => {
  it('accepts every defined status', () => {
    for (const status of runStatusSchema.options) {
      expect(runStatusSchema.parse(status)).toBe(status);
    }
  });

  it('rejects an unknown status', () => {
    expect(() => runStatusSchema.parse('MOSTLY_FINE')).toThrow();
  });
});
