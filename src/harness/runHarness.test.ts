import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NativeAgent } from './agents/nativeAgent.js';
import { NativeContextProvider } from './providers/nativeContextProvider.js';
import { defaultRepoRoot, executeRun, type HarnessRunConfig } from './runHarness.js';
import type { ConditionId, ExperimentId } from '../domain/common/ids.js';
import type { Task } from '../domain/task/task.schema.js';
import { runSchema } from '../domain/run/run.schema.js';
import { traceSchema } from '../domain/trace/trace.schema.js';

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

const baseConfig: HarnessRunConfig = {
  experimentId: 'experiment-phase3-demo' as ExperimentId,
  conditionId: 'condition-native' as ConditionId,
  eepVersion: '0.1.0',
  evaluatorVersion: '0.1.0',
  benchmarkVersion: '1.0.0',
  environment: 'vitest',
};

function deps() {
  return { agent: new NativeAgent(), contextProvider: new NativeContextProvider() };
}

describe('executeRun (real fixture, happy path)', () => {
  it('resolves the fixture, runs the agent, and produces a schema-valid Run and Trace', async () => {
    const { run, trace } = await executeRun(debuggingTask, deps(), baseConfig);

    expect(runSchema.safeParse(run).success).toBe(true);
    expect(traceSchema.safeParse(trace).success).toBe(true);
    expect(trace.runId).toBe(run.id);
    expect(run.traceId).toBe(trace.id);
    expect(trace.agentReportedStatus).toBe('INCOMPLETE');
    expect(trace.actions.length).toBeGreaterThan(0);
    expect(trace.contextArtifactId).toBeDefined();
    expect(run.metadata.agentName).toBe('native');
    expect(run.metadata.contextProviderName).toBe('native');
    expect(run.metadata.repositorySha).toBe(debuggingTask.repository.commitSha);
  });

  it('always cleans up the sandbox workspace after the run', async () => {
    const seenPaths: string[] = [];
    const agent = new NativeAgent();
    const spyAgent = {
      name: agent.name,
      version: agent.version,
      run: async (request: Parameters<typeof agent.run>[0]) => {
        seenPaths.push(request.repositoryPath);
        return agent.run(request);
      },
    };

    await executeRun(debuggingTask, { agent: spyAgent, contextProvider: new NativeContextProvider() }, baseConfig);

    expect(seenPaths).toHaveLength(1);
    expect(existsSync(seenPaths[0]!)).toBe(false);
  });
});

describe('executeRun (missing fixture)', () => {
  it('reports ENVIRONMENT_FAILURE instead of throwing', async () => {
    const missingTask = {
      ...debuggingTask,
      id: 'debugging-missing',
      repository: { url: 'benchmark/fixtures/does-not-exist-xyz', commitSha: 'deadbeef' },
    } as Task;

    const { run, trace } = await executeRun(missingTask, deps(), baseConfig);

    expect(runSchema.safeParse(run).success).toBe(true);
    expect(traceSchema.safeParse(trace).success).toBe(true);
    expect(trace.agentReportedStatus).toBe('ENVIRONMENT_FAILURE');
    expect(trace.actions).toHaveLength(0);
  });
});

describe('defaultRepoRoot', () => {
  it('resolves to a directory containing benchmark/fixtures', () => {
    expect(existsSync(`${defaultRepoRoot()}/benchmark/fixtures`)).toBe(true);
  });
});
