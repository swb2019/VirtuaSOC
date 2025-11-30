# Contract: alerts-core

## Types

    export type Severity = "low" | "medium" | "high" | "critical";

    export interface SecurityAlert {
      id: string;
      source: string;
      message: string;
      severity: Severity;
      timestamp: string; // ISO 8601
    }

## Functions

    export function createAlert(input: {
      source: string;
      message: string;
      severity: Severity;
      timestamp?: string;
    }): SecurityAlert;

    export function filterAlertsBySeverity(
      alerts: SecurityAlert[],
      minSeverity: Severity
    ): SecurityAlert[];

## Invariants

- `createAlert` always returns a `SecurityAlert` with a non-empty, unique `id`.
- If `timestamp` is not provided or is empty/whitespace, `createAlert` uses the
  current time in ISO 8601 format.
- `filterAlertsBySeverity` preserves input order; it does not sort.
- Severity comparison: `low < medium < high < critical`.

## Notes

- All functions are pure and side-effect free.
- No IO, logging, or network in this module.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
