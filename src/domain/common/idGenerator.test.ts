import { describe, expect, it } from 'vitest';
import { generateId } from './idGenerator.js';

describe('generateId', () => {
  it('prefixes the generated id', () => {
    expect(generateId<'RunId'>('run')).toMatch(/^run-/);
  });

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId<'RunId'>('x')));
    expect(ids.size).toBe(20);
  });
});
