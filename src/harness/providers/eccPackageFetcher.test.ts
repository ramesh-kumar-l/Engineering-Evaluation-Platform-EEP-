import { describe, expect, it } from 'vitest';
import type { EccCliInvoker } from './eccCliInvoker.js';
import { EccInvocationError } from './eccCliInvoker.js';
import { fetchValidatedEccPackage } from './eccPackageFetcher.js';

function fakeInvoker(stdout: string | Error): EccCliInvoker {
  return {
    invoke: () => (stdout instanceof Error ? Promise.reject(stdout) : Promise.resolve(stdout)),
  };
}

function buildValidPackageJson(): string {
  return JSON.stringify({
    version: '0.1',
    task: { type: 'explain', request: 'explain the retriever' },
    repository: { name: 'fixture', commit: 'abc123' },
    context: { primary: [], supporting: [] },
    conflicts: [],
    history: [],
    constraints: [],
    unknowns: [],
    verification: [],
    excluded: [],
  });
}

describe('fetchValidatedEccPackage', () => {
  it('returns the parsed, schema-valid package on success', async () => {
    const pkg = await fetchValidatedEccPackage(fakeInvoker(buildValidPackageJson()), '/fixture', 'explain it');
    expect(pkg.version).toBe('0.1');
    expect(pkg.context.primary).toEqual([]);
  });

  it('propagates the invoker error when the CLI itself fails', async () => {
    await expect(
      fetchValidatedEccPackage(fakeInvoker(new EccInvocationError('CLI exploded')), '/fixture', 'x'),
    ).rejects.toThrow(EccInvocationError);
  });

  it('throws EccInvocationError when stdout is not valid JSON', async () => {
    await expect(
      fetchValidatedEccPackage(fakeInvoker('not json at all'), '/fixture', 'x'),
    ).rejects.toThrow(EccInvocationError);
  });

  it('throws EccInvocationError when the JSON does not match the package schema', async () => {
    await expect(
      fetchValidatedEccPackage(fakeInvoker(JSON.stringify({ unexpected: true })), '/fixture', 'x'),
    ).rejects.toThrow(EccInvocationError);
  });
});
