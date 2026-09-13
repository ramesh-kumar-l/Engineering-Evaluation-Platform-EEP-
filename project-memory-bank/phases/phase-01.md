# Phase 01 — Evaluation Contract

## Objective (from [[13-roadmap]])

Domain objects, schemas, versioning, artifact model.

## Implemented

- All 14 domain entities from [[05-domain-model]] as Zod schemas under `src/domain/`, one
  subdirectory per entity family (`task/`, `experiment/`, `evidence/`, `trace/`,
  `verification/`, `outcome/`, `run/`, `metric/`, `evaluation/`, `report/`), plus shared
  primitives under `src/domain/common/` (branded IDs, semver, ISO timestamps, the
  `RunStatus` taxonomy).
- `ContextProvider` and `Agent` interfaces under `src/domain/providers/`, matching
  [[04-architecture]]'s layering — EEP's core depends only on these contracts.
- A schema-versioning convention: every entity module exports a `<ENTITY>_SCHEMA_VERSION`
  semver constant and embeds it as a literal `schemaVersion` field, so a serialized artifact
  self-describes the schema version it was written against (see [[14-decisions]] ADR-005 and
  [[10-reproducibility]] §Independent versioning axes).
- Compile-time-branded entity IDs (`TaskId`, `RunId`, etc.) so, e.g., a `TaskId` cannot be
  passed where a `RunId` is expected, without depending on a specific Zod version's branding
  API.
- 46 unit tests (one file per schema module) covering: valid-object acceptance, rejection of
  missing/invalid required fields, and default-value behavior.
- Updated all 6 pre-existing `schemas/*.md` stubs plus 8 new ones (one per remaining entity) to
  point at the TypeScript source as the single source of truth, per the memory-bank
  token-efficiency rule (no duplicated field lists).
- `zod` added as a runtime dependency; `eslint.config.js` updated to allow `_`-prefixed unused
  destructured variables (needed for the "delete a required field and assert rejection" test
  pattern used throughout the schema tests).

## Decisions made

See [[14-decisions]] ADR-005: Zod as the schema/validation library, semver-literal
`schemaVersion` fields as the versioning convention, custom (not Zod-native) ID branding.

## Explicitly not implemented (by design, deferred to later phases)

- Any concrete `ContextProvider` or `Agent` implementation (native/no-op, ECC) — Phase 3/6.
- Benchmark tasks — Phase 2.
- Evaluation engine, metric computation, verification execution — Phases 4-5.
- Serialization/persistence helpers (reading/writing JSON/JSONL artifacts to disk) — introduced
  when Phase 3's harness needs them, not speculatively now.
- CLI commands of any kind.

## Known limitations

- Schemas validate shape and simple invariants (non-empty strings, non-negative numbers, enum
  membership) but not cross-entity referential integrity (e.g. that a `Run.taskId` actually
  refers to an existing `Task`) — that belongs to the Phase 3 harness/store, not the schema
  layer.
- `taskCategorySchema` fixes the 8 categories from [[07-benchmark-strategy]] as a closed enum;
  if Phase 2 benchmark design needs a 9th category, `TASK_SCHEMA_VERSION` bumps accordingly.

## Risks discovered

None new. The branded-ID approach was chosen specifically to reduce ADR-002's TypeScript-stack
risk of ID mixups across the now-larger domain model — see [[16-risks]].

## Status

Complete, pending user approval to begin Phase 2 (Benchmark V1).
