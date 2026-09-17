import { mkdtempSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { executeAgentTool, LLM_AGENT_TOOLS, resolveWorkspacePath, ToolPathEscapeError } from './llmAgentTools.js';

function freshWorkspace(): string {
  return mkdtempSync(join(tmpdir(), 'eep-tools-'));
}

describe('LLM_AGENT_TOOLS', () => {
  it('exposes exactly the four bounded tools — no generic shell-exec tool', () => {
    expect(LLM_AGENT_TOOLS.map((t) => t.name)).toEqual(['list_files', 'read_file', 'write_file', 'run_tests']);
  });
});

describe('resolveWorkspacePath', () => {
  it('resolves a normal relative path inside the workspace', () => {
    const root = freshWorkspace();
    expect(resolveWorkspacePath(root, 'a/b.js').startsWith(root)).toBe(true);
  });

  it('rejects a path that escapes the workspace root via ..', () => {
    const root = freshWorkspace();
    expect(() => resolveWorkspacePath(root, '../../etc/passwd')).toThrow(ToolPathEscapeError);
  });

  it('rejects an absolute path', () => {
    const root = freshWorkspace();
    expect(() => resolveWorkspacePath(root, '/etc/passwd')).toThrow(ToolPathEscapeError);
  });
});

describe('executeAgentTool', () => {
  it('list_files lists repository files relative to the root', async () => {
    const root = freshWorkspace();
    writeFileSync(join(root, 'a.js'), '// a', 'utf-8');
    const result = await executeAgentTool(root, 'list_files', {});
    expect(result).toContain('a.js');
  });

  it('read_file returns file contents', async () => {
    const root = freshWorkspace();
    writeFileSync(join(root, 'a.js'), 'module.exports = 1;', 'utf-8');
    const result = await executeAgentTool(root, 'read_file', { path: 'a.js' });
    expect(result).toBe('module.exports = 1;');
  });

  it('read_file returns an error string, never a throw, for a path escaping the workspace', async () => {
    const root = freshWorkspace();
    const result = await executeAgentTool(root, 'read_file', { path: '../outside.txt' });
    expect(result).toContain('Error');
    expect(result).toContain('escapes the workspace root');
  });

  it('write_file creates a new file, including nested directories', async () => {
    const root = freshWorkspace();
    const result = await executeAgentTool(root, 'write_file', {
      path: 'nested/dir/out.txt',
      content: 'hello',
    });
    expect(result).toContain('Wrote');
    expect(await readFile(join(root, 'nested', 'dir', 'out.txt'), 'utf-8')).toBe('hello');
  });

  it('write_file rejects a path escaping the workspace root', async () => {
    const root = freshWorkspace();
    const result = await executeAgentTool(root, 'write_file', { path: '../escape.txt', content: 'x' });
    expect(result).toContain('Error');
  });

  it("run_tests runs the fixture's own npm test and reports the exit code", async () => {
    const root = freshWorkspace();
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ name: 'fixture', scripts: { test: 'node -e "process.exit(0)"' } }),
      'utf-8',
    );
    const result = await executeAgentTool(root, 'run_tests', {});
    expect(result).toContain('Exit code 0');
  }, 15_000);

  it('returns a descriptive string for an unknown tool name rather than throwing', async () => {
    const root = freshWorkspace();
    const result = await executeAgentTool(root, 'delete_everything', {});
    expect(result).toContain('Unknown tool');
  });
});
