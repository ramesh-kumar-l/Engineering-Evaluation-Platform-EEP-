import { describe, expect, it } from 'vitest';
import type { ContextArtifact } from '../../domain/evidence/context-artifact.schema.js';
import type { Task } from '../../domain/task/task.schema.js';
import { buildInitialUserMessage, buildSystemPrompt } from './promptBuilder.js';

const task = {
  schemaVersion: '1.0.0',
  id: 'debugging-01',
  taskVersion: '1.0.0',
  title: 'Off-by-one error in pagination utility',
  description: 'Fix the pagination boundary bug.',
  category: 'debugging',
  complexity: 'L1',
  repository: { url: 'benchmark/fixtures/debugging-01', commitSha: 'abc123' },
  acceptanceCriteria: ['paginate() returns correct pages.', 'No item is ever omitted.'],
  verificationMethod: 'test-suite: run the pagination tests.',
  tags: [],
  createdAt: '2026-09-13T00:00:00Z',
} as Task;

describe('buildSystemPrompt', () => {
  it('mentions every bounded tool by name', () => {
    const prompt = buildSystemPrompt();
    for (const tool of ['list_files', 'read_file', 'write_file', 'run_tests']) {
      expect(prompt).toContain(tool);
    }
  });
});

describe('buildInitialUserMessage', () => {
  it('includes the task title, description, acceptance criteria, and verification method', () => {
    const message = buildInitialUserMessage(task);
    expect(message).toContain(task.title);
    expect(message).toContain(task.description);
    expect(message).toContain('paginate() returns correct pages.');
    expect(message).toContain(task.verificationMethod);
  });

  it('appends the context artifact content when one is provided', () => {
    const contextArtifact = {
      content: 'Curated context: pagination.js is the relevant file.',
    } as ContextArtifact;

    const message = buildInitialUserMessage(task, contextArtifact);
    expect(message).toContain('Curated context: pagination.js is the relevant file.');
  });

  it('omits the "Additional context" section when no context artifact is given', () => {
    const message = buildInitialUserMessage(task);
    expect(message).not.toContain('Additional context');
  });
});
