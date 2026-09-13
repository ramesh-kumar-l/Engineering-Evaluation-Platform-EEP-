# Trace Schema

Purpose: canonical representation of the full engineering interaction lifecycle captured per run
— context, actions, decisions, retries, redaction status (see [[05-domain-model]] `Trace`,
[[11-security]]). `Action` and `Decision` are related but separate schemas, embedded by reference
within a Trace's arrays.

**Implemented:**
- `src/domain/trace/trace.schema.ts` — version constant `TRACE_SCHEMA_VERSION` (currently
  `1.0.0`). Tests: `src/domain/trace/trace.schema.test.ts`.
- `src/domain/trace/action.schema.ts` — version constant `ACTION_SCHEMA_VERSION` (currently
  `1.0.0`). Tests: `src/domain/trace/action.schema.test.ts`.
- `src/domain/trace/decision.schema.ts` — version constant `DECISION_SCHEMA_VERSION` (currently
  `1.0.0`). Tests: `src/domain/trace/decision.schema.test.ts`.

Configurable redaction (`redactionApplied` on Trace, `redacted` on Evidence/ContextArtifact) is
modeled now; the actual redaction logic is later phase work (Phase 3+) — see [[11-security]].

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
