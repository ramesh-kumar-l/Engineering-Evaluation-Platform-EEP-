import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createIsolatedWorkspace, FixtureNotFoundError } from './workspace.js';

describe('createIsolatedWorkspace', () => {
  it('copies fixture contents into a fresh sandbox, excluding .git', async () => {
    const fixture = mkdtempSync(join(tmpdir(), 'eep-fixture-src-'));
    writeFileSync(join(fixture, 'main.js'), 'module.exports = 1;', 'utf-8');
    mkdirSync(join(fixture, '.git'));
    writeFileSync(join(fixture, '.git', 'HEAD'), 'ref: refs/heads/main', 'utf-8');

    const workspace = await createIsolatedWorkspace(fixture);
    try {
      expect(workspace.path).not.toBe(fixture);
      expect(readFileSync(join(workspace.path, 'main.js'), 'utf-8')).toBe('module.exports = 1;');
      expect(existsSync(join(workspace.path, '.git'))).toBe(false);
    } finally {
      await workspace.cleanup();
    }
  });

  it('removes the sandbox directory on cleanup', async () => {
    const fixture = mkdtempSync(join(tmpdir(), 'eep-fixture-src-'));
    writeFileSync(join(fixture, 'a.txt'), 'a', 'utf-8');

    const workspace = await createIsolatedWorkspace(fixture);
    await workspace.cleanup();

    expect(existsSync(workspace.path)).toBe(false);
  });

  it('throws FixtureNotFoundError for a missing fixture directory', async () => {
    const missing = join(tmpdir(), 'eep-fixture-does-not-exist-xyz');
    await expect(createIsolatedWorkspace(missing)).rejects.toThrow(FixtureNotFoundError);
  });
});
