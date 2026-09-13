# Verification Schema

Purpose: the check(s) applied to determine whether a run's output satisfies the Task's acceptance
criteria (see [[05-domain-model]] `Verification`, [[06-evaluation-methodology]] §Multi-evidence
outcome evaluation).

**Implemented:** `src/domain/verification/verification.schema.ts` (Zod). Version constant:
`VERIFICATION_SCHEMA_VERSION` (currently `1.0.0`). `verificationMethodSchema` enumerates every
method named in [[06-evaluation-methodology]], including `llm-judge` — which per that file must
never be the sole basis for an Outcome; that constraint is enforced at the evaluation-engine
level, not by this schema alone. Tests: `src/domain/verification/verification.schema.test.ts`.

**Verifier implementations (Phase 4):** `src/evaluation/verifiers/` implements the `Verifier`
interface for 2 of the 9 methods so far — `test-suite` (`testSuiteVerifier.ts`, runs the
fixture's real `npm test`) and `diff-analysis` (`diffAnalysisVerifier.ts`, generic pristine-vs-
workspace change detection). The other 7 are enum-only until a fixture needs them — see
[[phases/phase-04]] and ADR-008 in [[14-decisions]].

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
