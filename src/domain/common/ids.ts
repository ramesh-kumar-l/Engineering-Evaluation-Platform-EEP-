import { z } from 'zod';

/**
 * Compile-time-only branding so, e.g., a TaskId can't be passed where a RunId is expected,
 * even though both are plain strings at runtime.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

function brandedId<B extends string>(): z.ZodType<Brand<string, B>> {
  return z.string().min(1) as unknown as z.ZodType<Brand<string, B>>;
}

export const taskIdSchema = brandedId<'TaskId'>();
export type TaskId = z.infer<typeof taskIdSchema>;

export const experimentIdSchema = brandedId<'ExperimentId'>();
export type ExperimentId = z.infer<typeof experimentIdSchema>;

export const conditionIdSchema = brandedId<'ConditionId'>();
export type ConditionId = z.infer<typeof conditionIdSchema>;

export const runIdSchema = brandedId<'RunId'>();
export type RunId = z.infer<typeof runIdSchema>;

export const traceIdSchema = brandedId<'TraceId'>();
export type TraceId = z.infer<typeof traceIdSchema>;

export const evidenceIdSchema = brandedId<'EvidenceId'>();
export type EvidenceId = z.infer<typeof evidenceIdSchema>;

export const contextArtifactIdSchema = brandedId<'ContextArtifactId'>();
export type ContextArtifactId = z.infer<typeof contextArtifactIdSchema>;

export const decisionIdSchema = brandedId<'DecisionId'>();
export type DecisionId = z.infer<typeof decisionIdSchema>;

export const actionIdSchema = brandedId<'ActionId'>();
export type ActionId = z.infer<typeof actionIdSchema>;

export const verificationIdSchema = brandedId<'VerificationId'>();
export type VerificationId = z.infer<typeof verificationIdSchema>;

export const outcomeIdSchema = brandedId<'OutcomeId'>();
export type OutcomeId = z.infer<typeof outcomeIdSchema>;

export const metricIdSchema = brandedId<'MetricId'>();
export type MetricId = z.infer<typeof metricIdSchema>;

export const evaluationIdSchema = brandedId<'EvaluationId'>();
export type EvaluationId = z.infer<typeof evaluationIdSchema>;

export const reportIdSchema = brandedId<'ReportId'>();
export type ReportId = z.infer<typeof reportIdSchema>;
