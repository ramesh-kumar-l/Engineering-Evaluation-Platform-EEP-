# Engineering Evaluation Platform (EEP)

**Reproducible evaluation infrastructure for AI-assisted software engineering.**

EEP exists to answer one question with evidence rather than anecdote:

> Does an AI-assisted engineering system actually improve software-engineering outcomes?

It is a scientific instrument first and a dashboard/product second. EEP evaluates AI coding
agents (with or without external context providers, such as the separate
[Engineering Context Compiler (ECC)](#relationship-to-ecc)) against a benchmark of realistic
engineering tasks, capturing full traces and producing reproducible, falsifiable results.

## Status

Early foundation stage (Phase 0 of the roadmap — see
[`project-memory-bank/13-roadmap.md`](project-memory-bank/13-roadmap.md)). No evaluation engine,
benchmark, or CLI commands exist yet.

## Start here

All durable project context — charter, architecture, domain model, methodology, roadmap,
decisions, assumptions, risks, and current state — lives in
[`project-memory-bank/`](project-memory-bank/). Read the relevant memory-bank files before
reading source code or making changes.

## Relationship to ECC

The Engineering Context Compiler (ECC) is a separate, pre-existing repository. EEP treats ECC as
one external, unmodified implementation of a generic `ContextProvider` interface — EEP never
modifies ECC's source and never becomes coupled to its internals. See
[`project-memory-bank/00-project-charter.md`](project-memory-bank/00-project-charter.md).

## License

Apache License 2.0 — see [`LICENSE`](LICENSE).
