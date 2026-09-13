import { describe, expect, it } from 'vitest';
import { VERSION } from './index.js';

describe('toolchain smoke test', () => {
  it('exposes a semver-shaped VERSION', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
