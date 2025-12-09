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

### Initial module plan

- `alerts-core`: single source of truth for `SecurityAlert` and `Severity`,
  including pure helpers for alert creation and filtering.
- `ingest-core`: strict payload validators plus transformers that emit canonical
  alerts using the contracts published by `alerts-core`.
- `detections-core`: houses rule interfaces and correlation strategies (burst
  detection, frequency analysis, multi-signal joins).
- `cases-core`: governs case lifecycle state machines, assignment, and linkage
  back to alerts.
- `api-core`: minimal REST facade for ingesting new alerts and querying cases,
  enforcing authentication at the boundary.
- `cli`: thin operator tooling that shells out to `api-core` contracts for
  interactive workflows.
- Shared utilities: schema validation and redaction helpers consumed by the
  modules above without introducing IO dependencies.

Modules communicate only through their CONTRACT definitions; no module reaches
into another's `src` tree. When a module needs new capabilities it must extend
its own SPEC + CONTRACT first, then publish a new version that downstream
modules can depend on.

## Consequences

- AI agents can operate per-module with bounded context.
- Architecture decisions are explicit and version-controlled.
- Future modules (ingest pipelines, enrichment, correlation, case mgmt) can be
  added with the same pattern.

The high-level view is synced with `docs/architecture/ARCHITECTURE.md`, which
captures the current C4 context and container diagrams.
