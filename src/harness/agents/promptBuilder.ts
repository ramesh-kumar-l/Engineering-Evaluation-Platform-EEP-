import type { ContextArtifact } from '../../domain/evidence/context-artifact.schema.js';
import type { Task } from '../../domain/task/task.schema.js';

const SYSTEM_PROMPT = [
  'You are an automated software engineering agent participating in a controlled evaluation.',
  'You are given a coding task and a working copy of a repository, plus a bounded set of tools:',
  'list_files, read_file, write_file, and run_tests.',
  'Use them to explore the repository, make the necessary changes, and check your work.',
  'When you believe the task is complete, or you cannot make further progress, stop calling',
  'tools and reply with a brief plain-text summary of what you did.',
].join(' ');

/** The fixed system prompt every `LlmSolvingAgent` turn uses, independent of task or provider. */
export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Builds the first user turn from a `Task` plus whatever `ContextProvider` handed the agent
 * (native's plain file listing, ECC's curated package, or an ablated variant) — the only thing
 * that varies between conditions, per project-memory-bank/09-experiment-strategy.md.
 */
export function buildInitialUserMessage(task: Task, contextArtifact?: ContextArtifact): string {
  const sections = [
    `Task: ${task.title}`,
    '',
    task.description,
    '',
    'Acceptance criteria:',
    ...task.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    '',
    `Verification method: ${task.verificationMethod}`,
  ];

  if (contextArtifact?.content) {
    sections.push('', 'Additional context:', contextArtifact.content);
  }

  return sections.join('\n');
}
