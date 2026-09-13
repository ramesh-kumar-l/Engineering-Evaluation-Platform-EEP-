import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listFilesRecursive } from './listFiles.js';

describe('listFilesRecursive', () => {
  it('lists nested files as root-relative paths', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'eep-listfiles-test-'));
    writeFileSync(join(dir, 'a.txt'), 'a', 'utf-8');
    mkdirSync(join(dir, 'nested'));
    writeFileSync(join(dir, 'nested', 'b.txt'), 'b', 'utf-8');

    const files = (await listFilesRecursive(dir)).map((f) => f.replace(/\\/g, '/')).sort();
    expect(files).toEqual(['a.txt', 'nested/b.txt']);
  });

  it('caps the number of entries at the given limit', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'eep-listfiles-test-'));
    for (let i = 0; i < 5; i += 1) {
      writeFileSync(join(dir, `f${i}.txt`), String(i), 'utf-8');
    }

    const files = await listFilesRecursive(dir, dir, 3);
    expect(files.length).toBeLessThanOrEqual(3);
  });
});
