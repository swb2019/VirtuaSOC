# ADR-0001: Module Boundaries & Patterns

Date: 2025-12-09

Status: Accepted

## Context

VirtuaSOC is developed by autonomous agents that must make safe, incremental
changes without central coordination. Every backlog item introduces or evolves a
module. Without clearly defined boundaries, the platform could accumulate
circular dependencies, unclear contracts, and un-auditable behavior—especially
because modules will span pure libraries (e.g., `alerts-core`) and IO-heavy
surfaces (API/CLI, delivery automations).

## Decision

1. **Module Capsules** — Every deliverable lives under `app/modules/<module>/`
   with the exact structure:
   - `SPEC.md`: requirements, acceptance criteria, success metrics.
   - `CONTRACT.md`: immutable API surface, invariants, and examples.
   - `src/`: implementation that only exports via `src/index.ts`.
   - `tests/`: vitest coverage proving the contract.
   - `docs/`: optional module-specific narratives/diagrams.
2. **Layered Dependency Graph** — Modules follow the inward-pointing dependency
   rule expressed in the C4 container view:
   - Core domain (`alerts-core`, future `ingest-core`, `detections-core`) are
     pure TypeScript logic with no IO.
   - Service modules (`cases-core`, `api-core`, `cli`) orchestrate IO but may
     only depend on the core modules and shared utilities.
   - Shared utilities (validation, redaction, logging) are isolated capsules and
     cannot reach into consuming modules.
3. **Contract-First Development** — Before writing code, agents must update the
   module's SPEC and CONTRACT. CI enforces that tests cover the exported surface
   and that cross-module usage happens via the declared contract only.
4. **Documentation Source of Truth** — System-level diagrams live in
   `docs/architecture/ARCHITECTURE.md`. Each ADR references the diagrams it
   depends on so future agents understand the context for changes.

## Consequences

- Modules are independently testable and releasable; `alerts-core` can evolve
  without touching ingestion or cases as long as its contract remains stable.
- Backlog delivery stays vertical: each PR updates SPEC/CONTRACT, adds logic,
  and proves behavior with tests.
- Architectural drift is minimized because every change either updates an ADR or
  creates a new one when the existing decision no longer fits.
- Onboarding new agents only requires reading the architecture document and this
  ADR to understand the allowable dependency directions.

## References

- [docs/architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — C4
  context + container diagrams that visualize the dependency graph.
- [ADR-0002](ADR-0002-alerts-core-design.md) — deep dive on `alerts-core`.
