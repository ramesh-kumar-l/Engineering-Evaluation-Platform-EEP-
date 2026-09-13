# Active Context

The single "resume here cold" file — read this first, before [[18-current-state]] or any
source code, if picking this project back up after a break.

## Where things stand right now

Phase 1 (Evaluation Contract) is implemented and verified: all 14 domain entities from
[[05-domain-model]] exist as Zod schemas under `src/domain/`, versioned individually via
`<ENTITY>_SCHEMA_VERSION` constants, with `ContextProvider`/`Agent` interfaces and 46 passing
unit tests. Full detail in [[phases/phase-01]] and `implementation-status.md`.

## What is NOT done

Nothing beyond the schema/contract layer exists yet: no benchmark tasks, no harness, no agent
or context-provider implementation, no evaluation/metrics logic, no CLI, no ECC adapter. Do not
assume any of these exist without checking `implementation-status.md` first.

## Immediate next step

Per the master prompt's strict phase gate, Phase 1 completion was reported to the user and
Phase 2 (Benchmark V1) has NOT started. Do not begin Phase 2 work without an explicit new
approval message from the user, even if this file is being read in a fresh session — see
[[20-next-actions]] and [[00-project-charter]] §Working protocol.

## Process reminders for whoever (human or agent) picks this up

- Read the memory bank before source code (this file, then [[18-current-state]] and
  [[19-phase-status]]) — it's kept deliberately more token-efficient than re-deriving state
  from the repo.
- Keep source files under ~300 lines; the `src/domain/` layout (one small file per entity,
  grouped by family folder) is the pattern to continue.
- Update this file and `implementation-status.md` at the end of any major feature, not only at
  phase boundaries — that's what keeps this file trustworthy as a save state.
- Never commit or push without the user explicitly asking, per the environment's Git Safety
  Protocol.
