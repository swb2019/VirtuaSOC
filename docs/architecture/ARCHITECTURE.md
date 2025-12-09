# VirtuaSOC Architecture

VirtuaSOC is a modular SOC automation platform that ingests raw telemetry and
OSINT, normalises it into canonical alerts, and ships structured intelligence
products. This document captures the current system view and anchors future work
using the C4 model. It will evolve as additional core modules land.

## C4 Level 1 – System Context

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart LR
    subgraph External Actors
        CSO[CSO & Security Stakeholders]
        Analysts[Security Analysts]
        Feeds[OSINT / Telemetry Sources]
        Targets[Delivery Surfaces\n(Notion, Email, SMS)]
    end

    VirtuaSOC[VirtuaSOC Platform]

    Feeds -->|Events, Alerts, Intelligence| VirtuaSOC
    CSO -->|Objectives, Tasks| VirtuaSOC
    VirtuaSOC -->|Automated Intelligence Products| Targets
    Analysts <-->|Review & Override| VirtuaSOC
```

VirtuaSOC sits between noisy external signals and the decision-makers who need
standardised, auditable outputs. Autonomous modules collaborate strictly through
typed contracts to keep AI contributors confined to well-defined surfaces.

## C4 Level 2 – Container Diagram

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph VirtuaSOC
        subgraph Core Domain
            ALERTS[alerts-core\nData model + severity filtering]
            DETECTIONS[detections-core\nRule engine & correlation]
            CASES[cases-core\nCase state machine]
        end

        INGEST[ingest-core\nCanonical event parsing]
        API[api-core\nREST surface]
        CLI[cli\nOperator tooling]
        SharedUtils[shared utilities\n(validation, logging)]
    end

    Feeds[Sensor & OSINT feeds] --> INGEST --> ALERTS
    ALERTS --> DETECTIONS --> CASES
    CASES --> API --> Targets[Notion/Automation endpoints]
    API --> CLI
    SharedUtils -.-> INGEST
    SharedUtils -.-> DETECTIONS
    SharedUtils -.-> CASES
```

### Module Responsibilities

- `alerts-core`: Pure domain definitions for `SecurityAlert`, `Severity`, and
  filter helpers. Serves every other module.
- `ingest-core`: Validates untrusted payloads, transforms them into canonical
  events, and emits `SecurityAlert`s.
- `detections-core`: Houses streaming/batch rules such as temporal correlation,
  threshold detection, and enrichment hooks.
- `cases-core`: Tracks case lifecycle (`open → triage → mitigated → closed`),
  assignment, and linkage back to alerts.
- `api-core`: Presents a minimal REST surface for ingest and querying alerts or
  cases. Enforces auth boundaries and rate limits.
- `cli`: Operator-oriented interface that shells out to `api-core` contracts
  for local testing or workflows.
- Shared utilities: Cross-cutting helpers (schema validation, log redaction)
  that must remain side-effect–free and dependency-light.

### Quality Attributes & Guardrails

- **Isolation:** Each module lives under `app/modules/<name>` with `SPEC.md`,
  `CONTRACT.md`, `src`, `tests`, and `docs`. This enables tight scope for
  autonomous workstreams.
- **Purity:** Core domain modules (`alerts-core`, future detection logic) avoid
  IO to keep behaviour deterministic and easily testable.
- **Security:** Untrusted inputs are validated at the edges (`ingest-core`,
  `api-core`). Secrets never enter the repo; environment variables are used at
  runtime.
- **Observability:** All modules expose metrics/events through well-defined
  interfaces so automation can assert health without direct access to internals.

### Evolution Path

1. Finish `alerts-core` domain behaviours (current focus).
2. Stand up ingestion + detection surfaces to convert raw events into actionable
   cases.
3. Expose `api-core` + `cli` for human‑in‑the‑loop workflows.
4. Layer specialised intelligence products and automation templates once the
   core lifecycle is reliable.

Refer to [ADR-0001](../adr/ADR-0001-initial-architecture.md) for module capsule
boundaries and [ADR-0002](../adr/ADR-0002-alerts-core-design.md) for details on
the initial domain implementation.

