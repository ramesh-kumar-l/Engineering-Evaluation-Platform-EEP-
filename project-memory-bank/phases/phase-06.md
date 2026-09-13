# Phase 6 — ECC Integration

## Objective

Per this round's user-specified exit criterion (narrower than [[13-roadmap]]'s full Phase 6
scope): a real `ContextProvider` implementation wrapping ECC via its external interface only —
no internal coupling to ECC's source.

## Implemented

- **`src/harness/providers/eccPackageSchema.ts`** — EEP's own independent Zod mirror of ECC's
  documented `EngineeringContextPackage` output contract (task, repository, ranked
  primary/supporting evidence with `relevance`/`trustLevel`/`provenance`, conflicts, history,
  constraints, unknowns, verification plan, exclusion summary). Deliberately re-declared rather
  than imported from ECC — if ECC's internal types ever changed shape, this file is the one
  place that would need updating, and EEP would never notice a source-level break because there
  is no source-level dependency to break.
- **`src/harness/providers/eccCliInvoker.ts`** — `ProcessEccCliInvoker`, a configurable subprocess
  wrapper around ECC's published CLI contract (`ecc context "<task>" --path <dir> [--budget
  <n>]`, documented in ECC's own README). Uses array-argument `execFile` (never shell string
  interpolation), matching ECC's own documented security posture, so a task description
  containing shell metacharacters can never be interpreted as a second command. Throws
  `EccInvocationError` (spawn failure, nonzero exit) or `EccTimeoutError` (wall-clock timeout)
  rather than ever returning a false success. The command/args are never hardcoded — default
  `ECC_CLI_COMMAND` env var, else `"ecc"` on PATH, with optional `commandArgs` for e.g. `node
  <checkout>/dist/cli/index.js` — so no EEP code encodes any one machine's ECC checkout location.
- **`src/harness/providers/eccContextProvider.ts`** — `EccContextProvider implements
  ContextProvider`, Condition B/C's real curated context source. Invokes ECC, parses stdout as
  JSON, validates it against `eccPackageSchema.ts`, and — only if valid — turns the
  pretty-printed, validated package into a schema-valid `ContextArtifact` (the package JSON
  itself is the `content`, i.e. exactly what a real integration would hand to a consuming agent).
  `tokenCount` uses Phase 5's `estimateTokenCount()` since ECC's CLI contract does not itself
  report one.

## Tests

5 new test files, 14 new tests (130 total across 41 files, up from 116/37):
`eccPackageSchema.test.ts` (valid/invalid package shapes, an invalid `trustLevel` enum value),
`eccCliInvoker.test.ts` (spawns small self-authored fake-CLI Node scripts — success, nonzero
exit, timeout, missing command, and argv-passthrough-safety cases — never depends on a real ECC
checkout), `eccContextProvider.test.ts` (injects a fake `EccCliInvoker`, no subprocess — valid
package, invoker failure, invalid JSON, schema-invalid JSON), and
`eccContextProvider.realCli.test.ts` — one real, end-to-end invocation of an actual sibling ECC
checkout's built CLI against this repository, `skipIf`-gated on that checkout existing at
`../Engineering-Context-Compiler/dist/cli/index.js` relative to this repo, so the suite stays
green (via a skip, not a failure) in any environment that only has this repo checked out.

## Validation

- `npm run build && npm test && npm run lint` — clean build, 130/130 tests passing across 41
  files, zero lint errors, including the real-ECC integration test actually running (not
  skipped) on this machine — confirmed by re-running it alone with the verbose reporter.
- `rm -rf dist && npm run build` — confirmed no `*.test.*` files leak into the compiled output.
- Quantitative modularity check: largest new source file is `eccCliInvoker.ts` at 101 lines,
  comfortably under the 300-line ceiling; all other new files are smaller.
- Security review note: task descriptions and repository paths reach the ECC subprocess only as
  `execFile` array arguments, never concatenated into a shell command string — a task description
  containing shell metacharacters cannot be interpreted as a second command (verified by a
  dedicated test). No new network calls; the only new I/O is the local subprocess invocation
  itself.

## Decisions made

ADR-010 in [[14-decisions]]: CLI subprocess invocation over an artifact-file contract or a
library import; EEP owns an independent schema mirror rather than trusting ECC's output
unchecked; the command invoked is fully configurable, never hardcoded.

## Explicitly not implemented (by design, later work)

- A real solving agent for Condition B/C — this phase's user-specified exit criterion covered
  only the `ContextProvider`. `NativeAgent` remains the only working agent; nothing yet plays the
  "does real work with ECC's context" role.
- An actual multi-condition comparison run (Native vs. ECC-assisted) against the benchmark —
  `EccContextProvider` is proven to work end-to-end in isolation, but no experiment has wired it
  together with an agent and run it across tasks yet.
- Extracting ECC's per-item `relevance`/`trustLevel`/`provenance.authority`/`provenance.freshness`
  data out of the opaque `ContextArtifact.content` into real `Evidence[]` records — this would be
  a genuine, non-fabricated future data source for 4 of ADR-009's 8 unimplemented secondary
  metrics, but no such extraction pipeline exists yet; noted as a next action, not built
  speculatively ahead of a concrete need.
- Any change to the `ContextProvider` interface itself — `EccContextProvider` implements the
  exact same contract `NativeContextProvider` already does, so nothing upstream (the harness,
  evaluation, or metrics layers) needed to change.

## Known limitations

- `EccContextProvider` depends on a working ECC installation being reachable via a configured
  command — there is no bundled/vendored fallback, by design (the repository boundary rule
  prohibits vendoring ECC into this repo).
- The real-CLI integration test is environment-conditional (`skipIf`); a reviewer running the
  suite without a built sibling ECC checkout will see it skipped, not passing — this is
  intentional (see ADR-010), but means that specific proof only re-runs on a machine with both
  repos present and built.
- ECC's CLI contract does not report a real token count, so `EccContextProvider` still relies on
  Phase 5's ~4-chars/token heuristic estimate, same as `NativeContextProvider`.

## Risks discovered

Two risk-register updates in [[16-risks]]: the pre-existing "stale engineering evidence" risk is
now assessed (ECC's contract does carry a `freshness` field per evidence item, but nothing reads
it yet); a new risk was added for depending on ECC as an external, versioned CLI dependency EEP
does not control, mitigated by schema validation and configurable invocation.

## Status

Complete (this round's scope: the `ContextProvider` only), pending user approval to proceed with
the rest of Phase 6's roadmap scope (real solving agent, actual comparison run) or to move to
Phase 7.
