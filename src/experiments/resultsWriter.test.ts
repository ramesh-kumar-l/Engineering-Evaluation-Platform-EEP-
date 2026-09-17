import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExperimentId, RunId } from '../domain/common/ids.js';
import { defaultResultsDir, readAllRunResults, writeRunResult, type RunResultBundle } from './resultsWriter.js';

function fakeBundle(): RunResultBundle {
  return {
    conditionName: 'native',
    taskId: 'debugging-01',
    taskCategory: 'debugging',
    taskComplexity: 'L1',
    run: { id: 'run-1' } as unknown as RunResultBundle['run'],
    trace: { id: 'trace-1' } as unknown as RunResultBundle['trace'],
    outcome: { id: 'outcome-1', status: 'SUCCESS' } as unknown as RunResultBundle['outcome'],
    verifications: [],
    evidence: [],
    metrics: [],
  };
}

describe('defaultResultsDir', () => {
  it('resolves to an "experiment-results" directory under the current working directory', () => {
    expect(defaultResultsDir()).toBe(join(process.cwd(), 'experiment-results'));
  });
});

describe('writeRunResult / readAllRunResults', () => {
  it('round-trips a run bundle to disk and back', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-results-'));
    const experimentId = 'experiment-test-1' as ExperimentId;
    const runId = 'run-test-1' as RunId;
    const bundle = fakeBundle();

    const filePath = await writeRunResult(bundle, experimentId, runId, resultsDir);
    expect(filePath).toContain(experimentId);

    const results = await readAllRunResults(experimentId, resultsDir);
    expect(results).toHaveLength(1);
    expect(results[0]?.conditionName).toBe('native');
    expect(results[0]?.taskCategory).toBe('debugging');
  });

  it('collects every run written for the same experiment', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-results-'));
    const experimentId = 'experiment-test-2' as ExperimentId;

    await writeRunResult(fakeBundle(), experimentId, 'run-a' as RunId, resultsDir);
    await writeRunResult(fakeBundle(), experimentId, 'run-b' as RunId, resultsDir);

    const results = await readAllRunResults(experimentId, resultsDir);
    expect(results).toHaveLength(2);
  });

  it('returns an empty array for an experiment with no written results', async () => {
    const resultsDir = await mkdtemp(join(tmpdir(), 'eep-results-'));
    const results = await readAllRunResults('experiment-does-not-exist' as ExperimentId, resultsDir);
    expect(results).toEqual([]);
  });
});
