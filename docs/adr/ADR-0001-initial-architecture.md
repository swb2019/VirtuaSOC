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
- Apply C4 modeling discipline:
  - `docs/architecture/ARCHITECTURE.md` must capture both Context and Container
    diagrams in Mermaid so autonomous contributors can reason visually.
  - Context diagrams show how VirtuaSOC interacts with Make.com, OSINT feeds,
    Notion, and human stakeholders.
  - Container diagrams depict each module capsule plus its IO boundaries.
- Enforce directional dependencies:
  - Core domain models (e.g., `alerts-core`) may not import from downstream
    modules.
  - Integration surfaces (`api-core`, CLI, automation hooks) may only depend on
    module contracts, never on private implementation details.
  - Cross-module communication happens via plain TypeScript types exported from
    the owning module's `CONTRACT.md`.
- Coding pattern:
  - Prefer pure functions and data-only types inside core modules to keep
    behavior deterministic and testable.
  - Guard external input with explicit parsers/validators (e.g., Zod) inside
    ingest-facing modules before constructing domain objects.
  - Tests should exercise both contract-level behavior and invariants stated in
    each module's SPEC.

Initial module: `alerts-core`, responsible for the in-memory alert model and
simple filtering logic.

## Consequences

- AI agents can operate per-module with bounded context.
- Architecture decisions are explicit and version-controlled.
- Future modules (ingest pipelines, enrichment, correlation, case mgmt) can be
  added with the same pattern.
- Visual C4 diagrams keep humans in the loop and provide fast onboarding.
- Dependency rules prevent accidental IO or cross-module coupling in the core.
