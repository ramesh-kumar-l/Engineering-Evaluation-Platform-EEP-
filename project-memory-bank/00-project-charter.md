# 00 — Project Charter

## Role

Acting as Senior Principal Architect / Staff+ Engineer / Evaluation Scientist for the
Engineering Evaluation Platform (EEP). The objective is not to write code for its own sake, but
to build a useful, reliable, reproducible, explainable, secure, extensible, open-source,
scientifically credible evaluation instrument.

## Mission

Build reproducible evaluation infrastructure that determines, with evidence rather than opinion,
whether AI-assisted engineering context materially improves software-engineering outcomes.

## What EEP is

- A scientific instrument for evaluating AI-assisted software engineering.
- A vendor-neutral benchmark, experiment, trace-capture, and metrics system.
- A CLI-first, local-first tool, with a dashboard as a later, secondary consumer of the same
  canonical artifacts.
- Open-source, built and published incrementally, including negative/mixed results.

## What EEP is not (initially)

- Not an ECC analytics dashboard.
- Not an enterprise SaaS product.
- Not a cloud platform, Kubernetes deployment, or multi-agent orchestration system.
- Not optimized to make any particular system (including ECC) look good — see the primary
  hypothesis and falsifiability requirement in [[01-product-thesis]].

## Repository boundary rule (hard constraint)

The Engineering Context Compiler (ECC) is a **separate, pre-existing, protected repository**.

- EEP MUST NOT become a monorepo with ECC.
- EEP MUST NOT move ECC code into this repository.
- EEP MUST NOT modify ECC's existing source, refactor it, or "clean it up."
- EEP MUST NOT alter ECC behavior to influence experiment results.
- EEP integrates with ECC only through explicit, documented interfaces/adapters (CLI invocation,
  APIs, artifacts, schemas, subprocess boundaries) — ECC is simply one implementation of a
  generic `ContextProvider` contract. See [[04-architecture]].

This rule takes precedence over convenience or velocity at every phase.

## Scientific integrity rule (hard constraint)

Never manipulate benchmark tasks, metrics, evaluation criteria, statistical analysis, reports,
datasets, or baselines to make ECC (or any system under test) look better. If a system performs
worse, or results are mixed or inconclusive, report that clearly. See [[06-evaluation-methodology]]
and [[15-assumptions]].

## Governing document

This memory bank is a compressed, durable synthesis of the full master system prompt governing
this project ("Engineering Evaluation Platform — Master System Prompt for Claude"). When this
memory bank and the master prompt appear to conflict, treat it as a signal to re-read the master
prompt section in question rather than assuming the memory bank is authoritative — the memory
bank is a summary, not a replacement.

## Working protocol (hard constraint)

Development proceeds in explicit, numbered phases (see [[13-roadmap]]). After each phase:
implement → validate → document → update memory bank → **STOP** → ask the user for explicit
approval before starting the next phase. Never assume approval. Never self-chain phases.
