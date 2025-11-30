# Module: alerts-core

## Goal

Provide core in-memory alert types and basic querying utilities for VirtuaSOC.

## Scope

- In-memory only; no network, filesystem, or database operations.
- Define a `SecurityAlert` model and severity levels.
- Provide functions to:
  - Create a new alert from input data.
  - Filter alerts by minimum severity.

## Design Notes

- **ID generation**: IDs are generated using timestamp + random suffix. This is
  non-cryptographic and intended for tracking/correlation only, not security.
- **Severity ordering**: The order `low < medium < high < critical` is an
  internal implementation detail used by filtering; callers should not depend
  on numeric representations.

## Acceptance Criteria

- [ ] `createAlert(input)` returns a `SecurityAlert` with:
  - A non-empty `id` (string).
  - `source`, `message`, and `severity` copied from input.
  - `timestamp` as ISO 8601 string (if not provided, use current time).
- [ ] `filterAlertsBySeverity(alerts, minSeverity)` returns only alerts whose
  severity is >= `minSeverity` in the order:
  `low < medium < high < critical`.
- [ ] Unit tests for:
  - Creating alerts with and without explicit timestamp.
  - Filtering alerts at each severity threshold.
- [ ] `pnpm test` passes.

## Security & Compliance

- No secrets, credentials, or network calls.
- No logging of alert contents in this module; logging will be handled elsewhere.

## Test Plan

- Vitest tests in `app/modules/alerts-core/tests/alerts-core.test.ts`.
