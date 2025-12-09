# ADR-0001: VirtuaSOC Modular Architecture

- **Date:** 2025-11-30
- **Status:** Accepted

## Context

VirtuaSOC must automate 35+ intelligence products with minimal operator touch.
Autonomous agents will extend the platform frequently, so we need an explicit
module structure that:

- Keeps critical domain logic pure and dependency-light.
- Enables parallel module work without merge chaos.
- Guarantees every change is test-backed and traceable to a contract.

## Decision

### Repository layout

- Source lives in a single monorepo.
- Each module sits under `app/modules/<module>/` with the following required
  assets:
  - `SPEC.md`: requirements, acceptance criteria, and links to backlog items.
  - `CONTRACT.md`: public API surface (types, functions, invariants).
  - `src/**`: implementation; no cross-module `src` imports unless going through
    the contract.
  - `tests/**`: Vitest suites proving module behavior.
  - `docs/**`: module-level diagrams, runbooks, or playbooks.
- Cross-cutting documentation:
  - `docs/architecture/ARCHITECTURE.md` holds the live C4 diagrams and module
    dependency views.
  - `docs/adr/**` stores immutable architectural decisions like this one.

### Module boundaries

| Module          | Responsibility                                         | Allowed dependencies            |
|-----------------|--------------------------------------------------------|---------------------------------|
| `alerts-core`   | Canonical `SecurityAlert` domain model and utilities.  | None (root layer).              |
| `ingest-core`   | Canonical event type + JSON schema validation.         | `alerts-core`.                  |
| `detections-core` | Correlation/rule engine abstractions.               | `alerts-core`, `ingest-core`.   |
| `cases-core`    | Case lifecycle, ownership, SLA tracking.               | `alerts-core`, `detections-core`. |
| `api-core`      | REST/HTTP boundary that exposes ingest/query.          | Any lower core module only.     |
| `cli`           | Operator CLI reusing the `api-core` contract.          | `api-core`.                     |

Rules:
- Dependencies only flow from higher-level modules to lower-level modules (never
  in reverse). When in doubt, extract shared concepts into a lower core module.
- Modules expose *only* the symbols defined in their `CONTRACT.md`. Internal
  helpers remain private.
- All external IO (network, filesystem, logging) happens inside `api-core` or
  other integration surfaces, never inside core domain code.

### Patterns

- **C4-aligned documentation:** The context/container diagrams in
  `docs/architecture/ARCHITECTURE.md` must reflect every new module or interface.
- **Test-first development:** Each backlog item adds or updates Vitest suites
  under the affected module(s) before wiring new behavior.
- **Schema validation up front:** Input sanitization lives in `ingest-core` so
  that downstream modules can assume type safety.
- **Pure functions by default:** Core modules remain deterministic and
  side-effect-free, enabling in-memory execution during tests and CI.

## Consequences

- Autonomous agents can reason about isolated modules without scanning the whole
  repo, reducing context-switch cost.
- Architectural drift is minimized because every change must touch the
  appropriate SPEC/CONTRACT and documentation entries.
- Vertical slices remain small: new features land as module-scoped commits with
  clear boundaries, keeping the backlog moving predictably.
