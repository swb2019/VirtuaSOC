# ADR-0001: VirtuaSOC Modular Architecture

Date: 2025-11-30
Status: Accepted

## Context

VirtuaSOC will grow into a complex SOC platform. To safely use autonomous AI
agents for development, we need clear module boundaries, frozen contracts, and
auditability of architectural decisions.

Architecture knowledge must also be easily consumable by humans and agents.
Without a canonical C4 view, each run would rediscover how modules, Make.com
automations, and external data feeds connect. This slows delivery and risks
inconsistent assumptions between modules.

## Decision

- Use a monorepo with per-module directories under `app/modules/<module>/`.
- For each module:
  - `SPEC.md` describes requirements and acceptance criteria.
  - `CONTRACT.md` defines its public API and invariants.
  - `src/`, `tests/`, `docs/` contain implementation, tests, and docs.
- Keep system-level diagrams in `docs/architecture`.
- Store ADRs in `docs/adr`.
- Require `docs/architecture/ARCHITECTURE.md` to maintain C4 context and
  container diagrams so contributors understand boundaries before coding.
- Enforce that domain modules remain pure (no IO) and interact through their
  contracts. Delivery surfaces (API, CLI, automation hooks) sit at the edges and
  depend only on contracts.
- When introducing a new module, create SPEC + CONTRACT before writing logic so
  downstream modules have a stable contract to integrate with.

Initial module: `alerts-core`, responsible for the in-memory alert model and
simple filtering logic.

## Consequences

- AI agents can operate per-module with bounded context.
- Architecture decisions are explicit and version-controlled.
- Future modules (ingest pipelines, enrichment, correlation, case mgmt) can be
  added with the same pattern.
- The C4 diagrams provide a single source of truth for how VirtuaSOC connects to
  Make.com/Notion automation and external data feeds, reducing onboarding time.
- Pure domain modules plus frozen contracts make it safe to parallelize backlog
  items without merge-time surprises.
