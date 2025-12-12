# alerts-core

Core in-memory alert types and basic filtering utilities for VirtuaSOC.

This module defines:

- `SecurityAlert` and `Severity`.
- `createAlert(input)` for constructing alerts.
- `filterAlertsBySeverity(alerts, minSeverity)` for basic triage.

It is intentionally IO-free and pure. Ingestion, enrichment, storage, and
correlation will be handled by other modules.

## Status

- 2025-12-12: Acceptance criteria validated via expanded Vitest coverage (timestamp fallback, severity thresholds, order preservation). `pnpm test` is green.
