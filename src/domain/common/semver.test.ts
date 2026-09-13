import { describe, expect, it } from 'vitest';
import { semVerSchema } from './semver.js';

describe('semVerSchema', () => {
  it('accepts a valid semver string', () => {
    expect(semVerSchema.parse('1.2.3')).toBe('1.2.3');
  });

  it('rejects a non-semver string', () => {
    expect(() => semVerSchema.parse('v1.2')).toThrow();
  });
});
