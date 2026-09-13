import { z } from 'zod';
import { metricIdSchema, runIdSchema } from '../common/ids.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const METRIC_SCHEMA_VERSION = '1.0.0';

/** The five primary metrics — see project-memory-bank/08-metrics.md. */
export const PRIMARY_METRIC_NAMES = [
  'task-success',
  'engineering-quality',
  'time-to-correct-outcome',
  'context-efficiency',
  'human-intervention',
] as const;

/** Secondary metrics — see project-memory-bank/08-metrics.md. */
export const SECONDARY_METRIC_NAMES = [
  'evidence-recall',
  'evidence-precision',
  'evidence-authority',
  'evidence-freshness',
  'provenance-completeness',
  'context-redundancy',
  'context-tokens',
  'tool-calls',
  'agent-turns',
  'files-read',
  'files-changed',
  'failed-attempts',
  'retries',
  'regression-rate',
  'verification-completeness',
  'risk-classification',
  'decision-confidence',
] as const;

export const ALL_METRIC_NAMES = [...PRIMARY_METRIC_NAMES, ...SECONDARY_METRIC_NAMES] as const;

export const metricNameSchema = z.enum(ALL_METRIC_NAMES);
export type MetricName = z.infer<typeof metricNameSchema>;

/**
 * A single measured quantity computed from a Run/Trace/Outcome — see
 * project-memory-bank/05-domain-model.md. Metrics are never combined into one composite
 * score inside this schema (project-memory-bank/08-metrics.md §Anti-goal); aggregation is a
 * reporting-layer concern applied on top of individually drillable metric records.
 */
export const metricSchema = z.object({
  schemaVersion: z.literal(METRIC_SCHEMA_VERSION),
  id: metricIdSchema,
  runId: runIdSchema,
  name: metricNameSchema,
  value: z.number(),
  unit: z.string().min(1).optional(),
  computedAt: isoTimestampSchema,
});

export type Metric = z.infer<typeof metricSchema>;
