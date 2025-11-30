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

## Notes

- All functions are pure and side-effect free.
- No IO, logging, or network in this module.
- This contract is FROZEN for the Builder phase. Builders must not edit this file.
