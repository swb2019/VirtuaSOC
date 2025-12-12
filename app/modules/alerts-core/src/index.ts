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

function generateAlertId(): string {
  // Simple, deterministic-enough ID for our purposes.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function currentIsoTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Ensures we always persist a well-formed ISO 8601 timestamp.
 * - Returns canonical ISO string when the provided timestamp parses.
 * - Falls back to "now" for missing, blank, or invalid values.
 */
function resolveTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return currentIsoTimestamp();
  }

  const trimmed = timestamp.trim();
  if (!trimmed) {
    return currentIsoTimestamp();
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return currentIsoTimestamp();
  }

  return new Date(parsed).toISOString();
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
  return {
    id: generateAlertId(),
    source: input.source,
    message: input.message,
    severity: input.severity,
    timestamp: resolveTimestamp(input.timestamp),
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
