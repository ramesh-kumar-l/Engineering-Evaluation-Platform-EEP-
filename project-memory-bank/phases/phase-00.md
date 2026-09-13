# Phase 00 — Project Foundation

## Objective

Establish repository scaffolding, architecture principles, the `project-memory-bank/`, and
development standards, per master prompt §39 Phase 0.

## Implemented

- Repository scaffolding: `package.json`, `tsconfig.json` (strict, ES2022, NodeNext), ESLint flat
  config, Prettier config, `.gitignore`.
- Minimal source to prove the toolchain: `src/index.ts` (placeholder `VERSION` export),
  `src/index.test.ts` (smoke test).
- `README.md` rewritten with EEP's positioning statement and a pointer to the memory bank.
- Full `project-memory-bank/` structure: 21 top-level files (`00`–`20`), 6 schema stubs under
  `schemas/`, this phase record under `phases/`.

## Decisions made

See [[14-decisions]] ADR-001 through ADR-004: separate-repo boundary from ECC, TypeScript/Node
stack, Vitest test runner, local-first/no-DB stance.

## Explicitly not implemented (by design, deferred to later phases)

CLI commands, domain model implementation, schemas beyond conceptual stubs, ECC adapter,
benchmark tasks, CI/GitHub Actions, CONTRIBUTING/CODE_OF_CONDUCT/issue templates.

## Known limitations

See [[17-known-limitations]].

## Risks discovered

None new beyond the seeded register in [[16-risks]] — all risks remain `Open` since no
evaluation logic exists yet to test them against.

## Status

Complete, pending user approval to begin Phase 1 (Evaluation Contract).
