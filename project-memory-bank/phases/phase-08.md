# Phase 8 — Ablation

## Objective

Per this round's user-specified exit criterion (matches [[13-roadmap]]'s Phase 8 row exactly):
per-component measurement of ECC's contribution.

## Implemented

- **`src/harness/providers/eccAblation.ts`** — the 7 named components from
  [[06-evaluation-methodology]] §Ablation discipline (history, memory, ranking, provenance, risk,
  budgeting, verification), each mapped onto a real field already present in ECC's documented
  package contract (`eccPackageSchema.ts`). `ablatePackage(pkg, component)` is a pure function
  (never mutates its input) that returns a copy with exactly one component's contribution removed
  — see ADR-012 for the exact per-component mapping.
- **`src/harness/providers/eccPackageFetcher.ts`** — `fetchValidatedEccPackage()`, the shared
  invoke+parse+validate logic extracted out of Phase 6's `eccContextProvider.ts` (no behavior
  change to it — its existing tests pass unmodified) so both providers share one validation path.
- **`src/harness/providers/ablatedEccContextProvider.ts`** — `AblatedEccContextProvider implements
  ContextProvider`, one instance per component, named `ecc-ablated:<component>`. Fetches the same
  full ECC package `EccContextProvider` would, applies that component's ablation, and turns the
  result into a `ContextArtifact` — a new Condition per component, per
  [[09-experiment-strategy]]'s "the only varying dimension is the ContextProvider."
- **`src/analysis/componentContribution.ts`** — `analyzeComponentContributions()`, the Phase 8
  measurement entry point. For each component, filters repeated-run records to just the full
  condition and that component's ablated condition, then calls Phase 7's `analyzeRepeatedRuns()`
  unchanged. No new statistics were written — an ablation comparison is structurally identical to
  any other condition-vs-baseline comparison Phase 7 already generalizes to (exact-table
  confidence intervals, Cohen's d/h, category/complexity breakdown, explicit `insufficient-data`
  results, never declaring a condition "better").

## Tests

4 new test files, 31 new tests (205 total across 53 files, up from 174/49):
`eccPackageFetcher.test.ts` (valid parse, invoker failure, invalid JSON, schema-invalid JSON —
mirrors the cases `eccContextProvider.test.ts` already covered, now also unit-tested at the
extracted layer), `eccAblation.test.ts` (each of the 7 components' transformation checked against
a hand-built sample package, immutability of the input, distinctness of every component's output
from the full package), `ablatedEccContextProvider.test.ts` (naming convention, ablated content
actually reaching the `ContextArtifact`, one test per component confirming distinct output, and
the same invoker-failure/invalid-JSON/schema-invalid error cases as `EccContextProvider`), and
`componentContribution.test.ts` (one result per requested component, each scoped to only its own
full-vs-ablated pair, baseline correctly set to the full condition, `insufficient-data` returned
rather than a crash when a component has too few ablated runs, category/complexity breakdown
present).

## Validation

- `npm run build && npm test && npm run lint` — clean build, 205/205 tests passing across 53
  files, zero lint errors.
- `rm -rf dist && npm run build` — confirmed no `*.test.*` files leak into the compiled output.
- Quantitative modularity check: all 4 new source files under 300 lines (largest is
  `eccAblation.ts` at 82 lines).

## Decisions made

ADR-012 in [[14-decisions]]: content-level ablation of ECC's own already-real package fields
(never a fabricated dimension, never a fork of ECC) as one `ContextProvider`/Condition per
component; measurement reuses Phase 7's `analyzeRepeatedRuns()` unmodified rather than
duplicating its statistics.

## Explicitly not implemented (by design, later work)

- Ablation has not been run against real experiment data — no actual multi-condition comparison
  run exists yet (Phase 6's remaining scope: a real solving agent and an actual comparison run).
  Validated only against synthetic fixtures in tests, the same way Phase 5's and Phase 7's
  functions were validated before real data existed.
- No change to `ContextProvider`/`Condition`/`Experiment` schemas — `AblatedEccContextProvider`
  implements the exact same interface every other provider does; nothing upstream needed to
  change.
- No automatic wiring of "run all 7 ablation conditions against the benchmark" — that is an
  experiment-orchestration concern (closer to Phase 6's remaining "actual comparison run" scope)
  and was not part of this round's exit criterion, which was the ablation *mechanism* and
  *measurement*, not running it end-to-end.

## Known limitations

- This is content-level, black-box ablation of ECC's CLI output — not a measurement of ECC's
  internal component architecture. If a component's real contribution leaks into a field EEP
  doesn't strip (e.g. a ranking algorithm's influence surviving in *which* items were selected as
  `primary` at all, not just their order), the isolation is imperfect. Documented in ADR-012, not
  silently assumed away.
- `ranking`'s ablation (reordering by path/identifier instead of ECC's relevance score) is one
  reasonable definition of "no ranking benefit," not the only possible one — chosen for
  determinism/reproducibility over alternatives like random shuffling.
- `provenance` ablation only strips the optional per-evidence-item `provenance` sub-object;
  `constraints[].provenance` is a required field in the schema and is left untouched, so
  provenance ablation is scoped to evidence, not every provenance-bearing field in the package.

## Risks discovered

No new risk-register row was needed — ADR-012's trade-offs section already documents the
imperfect-isolation limitation above; it is a limitation of the ablation method itself, not a new
operational risk in the sense [[16-risks]] tracks (bias, drift, cost, etc.).

## Status

Complete (this round's scope: the per-component ablation mechanism and measurement, matching
[[13-roadmap]]'s Phase 8 row exactly), pending user approval to proceed with an actual run against
real experiment data (which also requires Phase 6's remaining scope) or to move to Phase 9
(Reporting).
