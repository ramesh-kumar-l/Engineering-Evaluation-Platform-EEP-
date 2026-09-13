# ContextArtifact Schema

Purpose: the concrete context payload handed to the agent by a `ContextProvider` for a given run
(see [[05-domain-model]] `ContextArtifact`, [[04-architecture]]).

**Implemented:** `src/domain/evidence/context-artifact.schema.ts` (Zod). Version constant:
`CONTEXT_ARTIFACT_SCHEMA_VERSION` (currently `1.0.0`). Tests:
`src/domain/evidence/context-artifact.schema.test.ts`. The `ContextProvider` interface that
produces this artifact lives in `src/domain/providers/context-provider.ts` (a TypeScript
interface, not a Zod schema — see [[04-architecture]] §EEP / ECC boundary).

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
