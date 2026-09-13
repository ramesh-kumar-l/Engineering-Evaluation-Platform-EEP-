import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ConditionId, ExperimentId } from '../domain/common/ids.js';
import { outcomeSchema } from '../domain/outcome/outcome.schema.js';
import type { AgentRunRequest, AgentRunResult } from '../domain/providers/agent.js';
import type { Task } from '../domain/task/task.schema.js';
import { verificationSchema } from '../domain/verification/verification.schema.js';
import { NativeAgent } from '../harness/agents/nativeAgent.js';
import { NativeContextProvider } from '../harness/providers/nativeContextProvider.js';
import type { HarnessRunConfig } from '../harness/runHarness.js';
import { executeEvaluatedRun } from './evaluateRun.js';

const baseConfig: HarnessRunConfig = {
  experimentId: 'experiment-phase4-demo' as ExperimentId,
  conditionId: 'condition-native' as ConditionId,
  eepVersion: '0.1.0',
  evaluatorVersion: '0.1.0',
  benchmarkVersion: '1.0.0',
  environment: 'vitest',
};

const debuggingTask = {
  schemaVersion: '1.0.0',
  id: 'debugging-01',
  taskVersion: '1.0.0',
  title: 'Off-by-one error in pagination utility',
  description: 'Fix the pagination boundary bug.',
  category: 'debugging',
  complexity: 'L1',
  repository: {
    url: 'benchmark/fixtures/debugging-01',
    commitSha: 'f3518a1481b004c65015428304f9f202f9d801bf',
  },
  acceptanceCriteria: ['paginate() returns correct pages.'],
  verificationMethod: 'test-suite: run the pagination tests.',
  tags: [],
  createdAt: '2026-09-13T00:00:00Z',
} as Task;

const refactoringTask = {
  schemaVersion: '1.0.0',
  id: 'refactoring-01',
  taskVersion: '1.0.0',
  title: 'Extract duplicated validation logic',
  description: 'Extract the shared validation module.',
  category: 'refactoring',
  complexity: 'L2',
  repository: {
    url: 'benchmark/fixtures/refactoring-01',
    commitSha: '78e0541a234c6e2c360a310aa4ce9ae593b20067',
  },
  acceptanceCriteria: ['A shared module exists.'],
  verificationMethod: 'diff-analysis: confirm duplication removed, combined with a test-suite run.',
  tags: [],
  createdAt: '2026-09-13T00:00:00Z',
} as Task;

/** Test-only agent that genuinely fixes the debugging-01 bug, to prove SUCCESS is reachable. */
class FixPaginationAgent {
  readonly name = 'fix-pagination-test-double';
  readonly version = '1.0.0';

  async run(request: AgentRunRequest): Promise<AgentRunResult> {
    const target = join(request.repositoryPath, 'pagination.js');
    const original = await readFile(target, 'utf-8');
    const fixed = original.replace(
      'const end = start + pageSize - 1; // BUG: inclusive upper bound drops/omits boundary items',
      'const end = start + pageSize;',
    );
    await writeFile(target, fixed, 'utf-8');
    return { status: 'SUCCESS', actions: [], decisions: [] };
  }
}

describe('executeEvaluatedRun', () => {
  it(
    'reaches TASK_FAILURE when NativeAgent makes no fix and the fixture bug remains',
    async () => {
      const result = await executeEvaluatedRun(
        debuggingTask,
        { agent: new NativeAgent(), contextProvider: new NativeContextProvider() },
        baseConfig,
      );

      expect(outcomeSchema.safeParse(result.outcome).success).toBe(true);
      expect(result.outcome.status).toBe('TASK_FAILURE');
      expect(result.verifications).toHaveLength(1);
      expect(result.verifications[0]?.method).toBe('test-suite');
      expect(result.verifications[0]?.passed).toBe(false);
      for (const v of result.verifications) {
        expect(verificationSchema.safeParse(v).success).toBe(true);
      }
    },
    20_000,
  );

  it(
    'reaches SUCCESS when the agent genuinely fixes the bug (proves Outcome.status can actually succeed)',
    async () => {
      const result = await executeEvaluatedRun(
        debuggingTask,
        { agent: new FixPaginationAgent(), contextProvider: new NativeContextProvider() },
        baseConfig,
      );

      expect(result.trace.agentReportedStatus).toBe('SUCCESS');
      expect(result.outcome.status).toBe('SUCCESS');
      expect(result.verifications[0]?.passed).toBe(true);
    },
    20_000,
  );

  it(
    'reaches TASK_FAILURE for refactoring-01 because diff-analysis fails even though the pre-existing tests pass',
    async () => {
      const result = await executeEvaluatedRun(
        refactoringTask,
        { agent: new NativeAgent(), contextProvider: new NativeContextProvider() },
        baseConfig,
      );

      expect(result.verifications).toHaveLength(2);
      const byMethod = Object.fromEntries(result.verifications.map((v) => [v.method, v.passed]));
      expect(byMethod['test-suite']).toBe(true);
      expect(byMethod['diff-analysis']).toBe(false);
      expect(result.outcome.status).toBe('TASK_FAILURE');
    },
    20_000,
  );

  it('passes ENVIRONMENT_FAILURE through untouched with no verifications attempted', async () => {
    const missingTask = {
      ...debuggingTask,
      id: 'debugging-missing',
      repository: { url: 'benchmark/fixtures/does-not-exist-xyz', commitSha: 'deadbeef' },
    } as Task;

    const result = await executeEvaluatedRun(
      missingTask,
      { agent: new NativeAgent(), contextProvider: new NativeContextProvider() },
      baseConfig,
    );

    expect(result.outcome.status).toBe('ENVIRONMENT_FAILURE');
    expect(result.verifications).toHaveLength(0);
  });
});
