import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runNpmTest } from './runNpmTest.js';

function makeWorkspace(testScriptBody: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'eep-run-npm-test-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'fixture', scripts: { test: 'node run.test.js' } }),
    'utf-8',
  );
  writeFileSync(join(dir, 'run.test.js'), testScriptBody, 'utf-8');
  return dir;
}

describe('runNpmTest', () => {
  it(
    'resolves with the exit code and captured output on a zero exit',
    async () => {
      const dir = makeWorkspace('console.log("ok"); process.exit(0);');
      const outcome = await runNpmTest(dir, 15_000);

      expect(outcome.exitCode).toBe(0);
      expect(outcome.timedOut).toBe(false);
      expect(outcome.output).toContain('ok');
    },
    20_000,
  );

  it(
    'resolves with a non-zero exit code without rejecting',
    async () => {
      const dir = makeWorkspace('process.exit(1);');
      const outcome = await runNpmTest(dir, 15_000);

      expect(outcome.exitCode).toBe(1);
      expect(outcome.timedOut).toBe(false);
    },
    20_000,
  );

  it(
    'marks timedOut: true and kills the process when it exceeds timeoutMs',
    async () => {
      const dir = makeWorkspace('setTimeout(() => {}, 5000);');
      const outcome = await runNpmTest(dir, 300);

      expect(outcome.timedOut).toBe(true);
    },
    10_000,
  );
});
