export type Severity = "low" | "medium" | "high" | "critical";

export interface SecurityAlert {
  id: string;
  source: string;
  message: string;
  severity: Severity;
  timestamp: string; // ISO 8601
}

// NOTE: This is intentionally left as a stub.
// The BUILDER agent will implement it during the BUILD phase.
export function createAlert(input: {
  source: string;
  message: string;
  severity: Severity;
  timestamp?: string;
}): SecurityAlert {
  throw new Error("Not implemented: createAlert");
}

// NOTE: This is intentionally left as a stub.
// The BUILDER agent will implement it during the BUILD phase.
export function filterAlertsBySeverity(
  alerts: SecurityAlert[],
  minSeverity: Severity
): SecurityAlert[] {
  throw new Error("Not implemented: filterAlertsBySeverity");
}
