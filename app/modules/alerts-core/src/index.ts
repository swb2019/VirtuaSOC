export type Severity = "low" | "medium" | "high" | "critical";

export interface SecurityAlert {
  id: string;
  source: string;
  message: string;
  severity: Severity;
  timestamp: string; // ISO 8601
}

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];
const MIN_RANDOM_SEGMENT_LENGTH = 6;

function severityRank(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

function randomSegment(): string {
  const raw = Math.random().toString(36).slice(2);
  if (raw.length === 0) {
    return "alertid";
  }
  if (raw.length >= MIN_RANDOM_SEGMENT_LENGTH) {
    return raw;
  }
  return raw.padEnd(MIN_RANDOM_SEGMENT_LENGTH, "0");
}

function generateAlertId(): string {
  // Ensure suffix always has entropy even if Math.random() returns 0.
  return `${Date.now().toString(36)}-${randomSegment()}`;
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
  const timestamp =
    input.timestamp && input.timestamp.trim().length > 0
      ? input.timestamp
      : new Date().toISOString();

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
