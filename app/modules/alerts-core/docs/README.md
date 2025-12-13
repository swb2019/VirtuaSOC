# alerts-core

Core in-memory alert types and basic filtering utilities for VirtuaSOC.

This module defines:

- `SecurityAlert` and `Severity`.
- `createAlert(input)` for constructing alerts.
- `filterAlertsBySeverity(alerts, minSeverity)` for basic triage.

It is intentionally IO-free and pure. Ingestion, enrichment, storage, and
correlation will be handled by other modules.

## Acceptance checks

- `createAlert` generates ISO timestamps when not provided or when input is
  blank/whitespace.
- `filterAlertsBySeverity` keeps the original ordering of alerts while enforcing
  the severity threshold across `low`, `medium`, `high`, and `critical`.
