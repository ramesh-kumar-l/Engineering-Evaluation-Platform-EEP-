# 11 — Security

## Baseline stance (Phase 0)

- Local-first execution: no evaluation run requires sending source code to an external service.
- No source code leaves the local machine unless the user explicitly configures that.
- Secrets (API keys, tokens) are read from environment/config, never committed, never logged in
  traces by default.

## Target requirements (as private-repository evaluation becomes relevant)

Isolation of agent execution, configurable retention of artifacts, source-code privacy controls,
configurable redaction of traces (see [[04-architecture]] Trace model), least-privilege
subprocess execution, safe handling of generated artifacts (no arbitrary code execution from
untrusted artifacts without sandboxing).

## Redaction

Trace capture ([[05-domain-model]] `Trace`) must support configurable redaction so sensitive
repository content is not persisted or reported by default.

## Review discipline

Every phase's completion report must include an explicit security review note (master prompt
§38 Quality Gates, §62 Principal-Architect Review Checklist §Security) — even a one-line "no new
attack surface introduced" is required when a phase touches execution, subprocess, or artifact
handling.
