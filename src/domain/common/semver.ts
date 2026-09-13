import { z } from 'zod';

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * A plain `major.minor.patch` version string. Used for every independently versioned axis
 * (EEP itself, benchmark, evaluator, schemas, agents, context providers) per
 * project-memory-bank/10-reproducibility.md.
 */
export const semVerSchema = z
  .string()
  .regex(SEMVER_PATTERN, 'must be a semantic version like 1.0.0');

export type SemVer = z.infer<typeof semVerSchema>;
