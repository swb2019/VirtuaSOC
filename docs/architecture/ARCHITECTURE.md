# VirtuaSOC Architecture

VirtuaSOC automates the production of standardized intelligence deliverables for
physical and cyber security teams. This document captures the live system
architecture, the C4 context and container views, and the module boundaries that
govern work inside `app/modules/**`.

## System Context (C4 Level 1)

```mermaid
C4Context
    title VirtuaSOC System Context
    Person(cso, "Security & Intelligence Team", "Consumes reports, opens cases, and drives mitigations.")
    System_Ext(osint, "OSINT & Telemetry Feeds", "Shodan, Talkwalker, ACLED, HR/route systems, etc.")
    System_Ext(orchestrator, "Make.com Orchestrator", "Schedules workflows, triggers product generation, and distributes outputs.")
    System(virtuaSOC, "VirtuaSOC Platform", "Normalizes events, correlates detections, and produces standard products.")

    Rel(osint, virtuaSOC, "Streams alerts/events, pull-based APIs")
    Rel(orchestrator, virtuaSOC, "Invokes ingest/query APIs, polls health")
    Rel_Back(virtuaSOC, orchestrator, "Publishes PDFs, dashboards, tasks")
    Rel(cso, orchestrator, "Receives notifications & approvals")
    Rel(cso, virtuaSOC, "Reviews dashboards, triages detections")
```

Key points:
- VirtuaSOC is data-plane only; orchestrators own scheduling and final delivery.
- External feeds are treated as untrusted input and pass through strict schema
  validation prior to storage or correlation.

## Container View (C4 Level 2)

```mermaid
C4Container
    title VirtuaSOC Container View
    Person(cso, "Security & Intelligence Team")
    System_Ext(orchestrator, "Make.com Orchestrator", "Cron + webhook triggers")

    System_Boundary(virtuaSOC, "VirtuaSOC") {
        Container(ingestCore, "ingest-core", "TypeScript library", "Parses JSON payloads, enforces canonical Event schema.")
        Container(alertsCore, "alerts-core", "TypeScript library", "Defines SecurityAlert model + severity filtering.")
        Container(detectionsCore, "detections-core", "TypeScript library", "Runs correlation + rule evaluation.")
        Container(casesCore, "cases-core", "TypeScript library", "Manages case lifecycle, ownership, SLAs.")
        Container(apiCore, "api-core", "Fastify/HTTP service", "Minimal REST facade for ingest/query.")
        Container(cliTool, "cli", "Node CLI", "Developer/operator access to the contracts.")
        ContainerDb(domainState, "In-memory/domain stores", "Pure data structures per module; persistence plugged in later.")
    }

    Rel(orchestrator, apiCore, "POST /events, GET /alerts", "HTTPS/JSON")
    Rel(cliTool, apiCore, "Invokes same contract via CLI transport")
    Rel(ingestCore, alertsCore, "Emits normalized SecurityAlerts")
    Rel(alertsCore, detectionsCore, "Provides baseline alert entities")
    Rel(detectionsCore, casesCore, "Raises/updates cases")
    Rel(apiCore, ingestCore, "Calls parsers before persistence")
    Rel(apiCore, casesCore, "Reads case/alert projections for queries")
    Rel(casesCore, orchestrator, "Pushes case status webhooks (future)")
```

## Module Boundaries

| Module        | Responsibility                                                     | Dependencies                        |
|---------------|-------------------------------------------------------------------|-------------------------------------|
| `alerts-core` | Pure domain model for `SecurityAlert` + severity utilities.        | None (base layer).                  |
| `ingest-core` | Canonical event types and JSON parsers/validators.                 | `alerts-core` types.                |
| `detections-core` | Rule interface, correlation helpers, burst/threat logic.      | `alerts-core`, `ingest-core`.       |
| `cases-core`  | Case lifecycle, ownership, SLA timers, linkage to alerts.          | `alerts-core`, `detections-core`.   |
| `api-core`    | REST boundary for ingest/query; hosts schema validation.           | `ingest-core`, `alerts-core`, `cases-core`. |
| `cli`         | Operator tooling that shells into `api-core` contracts.            | `api-core` contract only.           |

Rules:
- Modules live in `app/modules/<name>` with `SPEC.md`, `CONTRACT.md`, `src/`,
  `tests/`, and `docs/`.
- Only depend inward (higher modules can consume lower ones; reverse is
  forbidden). Keep business logic pure and side-effect-free until API/integration
  surfaces.
- Each module owns its data contracts; sharing happens through explicit exports
  and versioned semantic changes.

## Data & Control Flow

1. **Ingest:** External events enter through `api-core`, which invokes
   `ingest-core` to validate and produce canonical events.
2. **Alerting:** Valid events transition into `alerts-core` models. Severity
   filters keep the data plane small and deterministic.
3. **Detection:** `detections-core` evaluates correlation rules, raising findings
   linked to original alerts/events.
4. **Case Management:** `cases-core` materializes incidents, tracks assignments,
   and exposes projections for downstream delivery (Notion, PDFs, etc.).
5. **Delivery:** Orchestrators query `api-core` or the CLI for data slices, then
   render per-product templates outside VirtuaSOC.

## Quality Attributes & Guardrails

- **Security-first:** All inbound payloads must pass schema validation before any
  business logic runs (see `ingest-core`). Sensitive artifacts never leak to logs.
- **Testability:** Modules keep IO at the edges, enabling fast Vitest suites.
- **Traceability:** ADRs capture architectural shifts; diagrams stay synced with
  the backlog-driven roadmap.
- **Deployability:** Containers are library-first; runtime surfaces (`api-core`,
  `cli`) use the same contracts, ensuring deterministic behavior.

## Future Work

The roadmap (see `ai/BACKLOG.md`) adds ingest, detection, cases, API, and CLI
modules. This architecture document should evolve alongside each addition,
keeping the C4 diagrams and boundary tables current.

