import { diffAnalysisVerifier } from './diffAnalysisVerifier.js';
import { testSuiteVerifier } from './testSuiteVerifier.js';
import type { Verifier } from './verifier.types.js';

/** Every verifier the evaluator knows how to run. Add new methods here as they're built. */
export const ALL_VERIFIERS: readonly Verifier[] = [testSuiteVerifier, diffAnalysisVerifier];

export * from './diffAnalysisVerifier.js';
export * from './testSuiteVerifier.js';
export * from './verifier.types.js';
