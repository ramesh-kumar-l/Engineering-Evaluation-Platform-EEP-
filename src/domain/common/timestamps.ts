import { z } from 'zod';

const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** An ISO-8601 timestamp with an explicit timezone (Z or +HH:MM), e.g. `2026-09-13T10:00:00Z`. */
export const isoTimestampSchema = z
  .string()
  .regex(ISO_TIMESTAMP_PATTERN, 'must be an ISO-8601 timestamp with timezone (e.g. Z or +00:00)');

export type IsoTimestamp = z.infer<typeof isoTimestampSchema>;
