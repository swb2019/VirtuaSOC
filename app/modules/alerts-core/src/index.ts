export type Severity = "low" | "medium" | "high" | "critical";

export interface SecurityAlert {
  id: string;
  source: string;
  message: string;
  severity: Severity;
  timestamp: string; // ISO 8601
}

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

function severityRank(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

function resolveTimestamp(timestamp?: string): string {
  if (!timestamp || timestamp.trim().length === 0) {
    return new Date().toISOString();
  }

  const trimmed = timestamp.trim();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  return trimmed;
}

function generateAlertId(): string {
  // Simple, deterministic-enough ID for our purposes.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Create a SecurityAlert from input.
 *
 * - Copies source, message, severity.
 * - Generates an id if none is provided.
 * - Uses the provided timestamp or the current time in ISO 8601.
 */
export function createAlert(input: {
  source: string;
  message: string;
  severity: Severity;
  timestamp?: string;
}): SecurityAlert {
  const timestamp = resolveTimestamp(input.timestamp);

  return {
    id: generateAlertId(),
    source: input.source,
    message: input.message,
    severity: input.severity,
    timestamp,
  };
}

/**
 * Filter alerts whose severity is at least minSeverity.
 *
 * Order is preserved from the original array.
 * Severity ordering: low < medium < high < critical.
 */
export function filterAlertsBySeverity(
  alerts: SecurityAlert[],
  minSeverity: Severity
): SecurityAlert[] {
  const minRank = severityRank(minSeverity);
  return alerts.filter(
    (alert) => severityRank(alert.severity) >= minRank
  );
}
