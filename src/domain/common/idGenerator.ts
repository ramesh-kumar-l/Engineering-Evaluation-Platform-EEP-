import { randomUUID } from 'node:crypto';
import type { Brand } from './ids.js';

/**
 * Generates a unique, human-scannable, branded entity ID (e.g. `run-3f2a1c9e-...`). Callers
 * specify which branded ID type they need, e.g. `generateId<'RunId'>('run')`, so any
 * adapter/harness code needing a fresh ID uses this rather than inventing its own scheme.
 */
export function generateId<B extends string>(prefix: string): Brand<string, B> {
  return `${prefix}-${randomUUID()}` as Brand<string, B>;
}
