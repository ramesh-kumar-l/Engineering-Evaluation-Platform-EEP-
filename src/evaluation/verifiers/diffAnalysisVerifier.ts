import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateId } from '../../domain/common/idGenerator.js';
import { isoTimestampSchema } from '../../domain/common/timestamps.js';
import { evidenceSchema } from '../../domain/evidence/evidence.schema.js';
import { verificationSchema } from '../../domain/verification/verification.schema.js';
import { listFilesRecursive } from '../../harness/support/listFiles.js';
import { VerificationExecutionError, type Verifier, type VerifierResult } from './verifier.types.js';

/**
 * Generic structural check: did the agent actually change anything relative to the pristine
 * fixture? This is a necessary-but-not-sufficient signal (it cannot know if a change is the
 * *right* change — that's what test-suite/acceptance-criteria verifiers are for), but it is a
 * strong, task-independent way to catch "the agent explored and reported success without
 * changing a single file" — see project-memory-bank/06-evaluation-methodology.md
 * §Multi-evidence outcome evaluation.
 */
export const diffAnalysisVerifier: Verifier = {
  method: 'diff-analysis',

  appliesTo(task) {
    return task.verificationMethod.toLowerCase().includes('diff-analysis');
  },

  async run(context): Promise<VerifierResult> {
    let pristineFiles: string[];
    let workspaceFiles: string[];
    try {
      [pristineFiles, workspaceFiles] = await Promise.all([
        listFilesRecursive(context.pristineFixturePath),
        listFilesRecursive(context.workspacePath),
      ]);
    } catch (error) {
      throw new VerificationExecutionError('Failed to list files for diff analysis', error);
    }

    const allPaths = new Set([...pristineFiles, ...workspaceFiles]);
    const changed: string[] = [];

    for (const relativePath of allPaths) {
      const before = await readFileIfExists(join(context.pristineFixturePath, relativePath));
      const after = await readFileIfExists(join(context.workspacePath, relativePath));
      if (before !== after) {
        changed.push(relativePath);
      }
    }

    const timestamp = isoTimestampSchema.parse(new Date().toISOString());
    const evidence = [
      evidenceSchema.parse({
        schemaVersion: '1.0.0',
        id: generateId<'EvidenceId'>('evidence'),
        kind: 'diff',
        description: `Files changed relative to pristine fixture: ${String(changed.length)}`,
        source: 'diff-analysis-verifier',
        content: changed.join('\n').slice(0, 8000),
        createdAt: timestamp,
      }),
    ];

    const verification = verificationSchema.parse({
      schemaVersion: '1.0.0',
      id: generateId<'VerificationId'>('verification'),
      runId: context.runId,
      method: 'diff-analysis',
      passed: changed.length > 0,
      detail:
        changed.length > 0
          ? `${String(changed.length)} file(s) changed: ${changed.join(', ')}`
          : 'No files changed relative to the pristine fixture',
      evidenceIds: evidence.map((e) => e.id),
      timestamp,
    });

    return { verification, evidence };
  },
};

async function readFileIfExists(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return undefined;
  }
}
