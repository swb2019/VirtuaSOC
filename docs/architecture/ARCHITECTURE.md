# VirtuaSOC Architecture

VirtuaSOC automates the production of intelligence products by normalizing
diverse OSINT feeds, applying security analytics, and publishing templated
reports into Notion. The system is grown incrementally through isolated modules
living under `app/modules/*`.

## C4 Context

```mermaid
%%{init: {'theme': 'neutral'}}%%
C4Context
    Person(cso, "CSO & SOC Team", "Own risk decisions and task the platform.")
    Person_Ext(stakeholders, "Business Stakeholders", "Receive tailored briefings.")
    System(virtuasoc, "VirtuaSOC Platform", "Automates analysis + templating.")
    System_Ext(orchestrator, "Make.com Orchestrator", "Schedules crons/webhooks.")
    System_Ext(osint, "OSINT & Telemetry Feeds", "Shodan, Talkwalker, FBI, OSAC, etc.")
    System_Ext(workspace, "Notion Workspace", "Holds master templates + reports.")
    Rel(cso, virtuasoc, "Submits tasking and reviews outputs")
    Rel(stakeholders, virtuasoc, "Receives alerts/actions")
    Rel(orchestrator, virtuasoc, "Initiates flows & provides prompts")
    Rel(osint, virtuasoc, "Streams normalized events")
    Rel(virtuasoc, workspace, "Publishes standardized products")
```

**Key interactions**
- OSINT sources push raw events that VirtuaSOC must normalize before analytics.
- Make.com orchestrates scheduling but never touches business logic; it only
  invokes module contracts (e.g., ingest, detections).
- Analysts review finished products in Notion and supply follow-up tasking.

## C4 Container (Logical)

```mermaid
%%{init: {'theme': 'neutral'}}%%
C4Container
    Person(cso, "CSO / SOC Analysts", "Consume alerts and intelligence.")
    System_Boundary(vsoc, "VirtuaSOC (pnpm + Node.js)") {
        Container(alerts, "alerts-core", "TypeScript lib", "SecurityAlert model + severity helpers.")
        Container(ingest, "ingest-core (planned)", "TypeScript lib", "Parses JSON payloads into canonical events.")
        Container(detect, "detections-core (planned)", "TypeScript lib", "Composes correlation/rule logic.")
        Container(cases, "cases-core (planned)", "TypeScript lib", "Case lifecycle + assignments.")
        Container(api, "api-core (planned)", "Fastify service", "Boundary for ingest/query operations.")
    }
    System_Ext(orchestratorC, "Make.com", "Cron + webhook initiator.")
    Rel(cso, cases, "Reviews/updates case status")
    Rel(orchestratorC, ingest, "Posts JSON payloads for parsing")
    Rel(ingest, alerts, "Creates canonical alerts")
    Rel(detect, alerts, "Reads alerts to produce detections")
    Rel(detect, cases, "Opens/updates cases")
    Rel(api, cso, "Provides CLI/API access")
```

**Container responsibilities**
- `alerts-core` is the single source of truth for the `SecurityAlert` shape,
  severity levels, and baseline filtering logic. All upstream/downstream modules
  depend on it but it stays pure and IO-free.
- Future ingest/detection/case/api modules live in the same repo but only talk
  to each other through documented contracts to keep blast radius small.
- `Make.com` remains an external automation boundary that exercises module APIs
  via HTTP/CLI without embedding business logic.

## Module guardrails

- Each module owns its documentation capsule (`SPEC.md`, `CONTRACT.md`,
  `src/`, `tests/`, `docs/`). Anything crossing module boundaries must be
  represented as TypeScript types exported from `CONTRACT.md`.
- Dependencies flow inbound toward the core. `alerts-core` exposes domain types,
  ingest uses those types to publish alerts, detections consumes them to raise
  cases, and `api-core` gates any IO.
- Tests must cover both happy-path and guard-rail behavior (e.g., invalid
  severity handling) before a module is considered ready for integration.

See [ADR-0001](../adr/ADR-0001-initial-architecture.md) for module boundary and
pattern decisions, and [ADR-0002](../adr/ADR-0002-alerts-core-design.md) for the
alerts core design.

