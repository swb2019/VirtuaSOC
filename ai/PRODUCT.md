# VirtuaSOC  Product Goal (Autopilot Input)

VirtuaSOC is a modular virtual SOC toolkit.
Primary outcome: ingest security signals, normalize them into a core alert model, and support triage workflows.

Autopilot priorities:
1) Alerts core primitives (data model, creation, filtering, validation).
2) Normalization adapters (parsers) for common formats (JSON, CSV, minimal CEF-like).
3) Correlation rules (pure functions first; no external services).
4) Storage abstraction (in-memory first; later plug in DB).

Constraints:
- TypeScript only for now.
- No production secrets or external SaaS dependencies.
- Keep each run to ONE module capsule under app/modules/<name>/.
