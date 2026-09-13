import { describe, expect, it } from 'vitest';
import type { ConditionId, ExperimentId } from '../domain/common/ids.js';
import type { Task } from '../domain/task/task.schema.js';
import { NativeAgent } from '../harness/agents/nativeAgent.js';
import { NativeContextProvider } from '../harness/providers/nativeContextProvider.js';
import type { HarnessRunConfig } from '../harness/runHarness.js';
import { executeEvaluatedRun } from '../evaluation/evaluateRun.js';
import { metricSchema } from '../domain/metric/metric.schema.js';
import { computeRunMetrics } from './computeMetrics.js';

const baseConfig: HarnessRunConfig = {
  experimentId: 'experiment-phase5-demo' as ExperimentId,
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

describe('computeRunMetrics (real fixture, end-to-end)', () => {
  it(
    'computes all 14 implemented metrics from a real evaluated run, every one schema-valid',
    async () => {
      const evaluated = await executeEvaluatedRun(
        debuggingTask,
        { agent: new NativeAgent(), contextProvider: new NativeContextProvider() },
        baseConfig,
      );

      const metrics = computeRunMetrics(evaluated);

      expect(metrics).toHaveLength(14);
      for (const metric of metrics) {
        expect(metricSchema.safeParse(metric).success).toBe(true);
        expect(metric.runId).toBe(evaluated.run.id);
      }

      const byName = Object.fromEntries(metrics.map((m) => [m.name, m.value]));
      expect(byName['task-success']).toBe(0); // NativeAgent never fixes the bug → TASK_FAILURE
      expect(byName['engineering-quality']).toBe(0); // its one verification (test-suite) fails
      expect(byName['tool-calls']).toBeGreaterThan(0); // NativeAgent reads every file
      expect(byName['context-tokens']).toBeGreaterThan(0); // NativeContextProvider has no tokenCount → estimated
      expect(byName['verification-completeness']).toBe(1); // the one applicable verifier executed cleanly
    },
    20_000,
  );
});
