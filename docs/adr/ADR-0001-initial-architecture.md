# ADR-0001: VirtuaSOC Modular Architecture

Date: 2025-11-30
Status: Accepted

## Context

VirtuaSOC will grow into a complex SOC platform. To safely use autonomous AI
agents for development, we need clear module boundaries, frozen contracts, and
auditability of architectural decisions.

## Decision

- Use a monorepo with per-module directories under `app/modules/<module>/`.
- For each module:
  - `SPEC.md` describes requirements and acceptance criteria.
  - `CONTRACT.md` defines its public API and invariants.
  - `src/`, `tests/`, `docs/` contain implementation, tests, and docs.
- Keep system-level diagrams in `docs/architecture`.
- Store ADRs in `docs/adr`.

Initial module: `alerts-core`, responsible for the in-memory alert model and
simple filtering logic.

## Consequences

- AI agents can operate per-module with bounded context.
- Architecture decisions are explicit and version-controlled.
- Future modules (ingest pipelines, enrichment, correlation, case mgmt) can be
  added with the same pattern.
