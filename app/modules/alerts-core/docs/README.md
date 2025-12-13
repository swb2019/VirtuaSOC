# alerts-core

Core in-memory alert types and basic filtering utilities for VirtuaSOC.

This module defines:

- `SecurityAlert` and `Severity`.
- `createAlert(input)` for constructing alerts.
- `filterAlertsBySeverity(alerts, minSeverity)` for basic triage.

It is intentionally IO-free and pure. Ingestion, enrichment, storage, and
correlation will be handled by other modules.

## Acceptance status

- [x] `createAlert` generates IDs and ISO timestamps, including blank timestamp fallback tests.
- [x] `filterAlertsBySeverity` is covered for `low`, `medium`, `high`, and `critical` thresholds.
- [x] Filtering tests assert original alert ordering is preserved.
