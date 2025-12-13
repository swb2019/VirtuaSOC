export type Severity = "low" | "medium" | "high" | "critical";

export interface SecurityAlert {
  id: string;
  source: string;
  message: string;
  severity: Severity;
  timestamp: string; // ISO 8601
}

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];
const VALID_SEVERITIES = new Set<Severity>(SEVERITY_ORDER);

function severityRank(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

function generateAlertId(): string {
  // Simple, deterministic-enough ID for our purposes.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function ensureSeverity(value: string): Severity {
  if (VALID_SEVERITIES.has(value as Severity)) {
    return value as Severity;
  }

  throw new Error(
    `Invalid severity "${value}". Expected one of: ${SEVERITY_ORDER.join(", ")}`,
  );
}

function resolveTimestamp(timestamp?: string): string {
  if (!timestamp || timestamp.trim().length === 0) {
    return new Date().toISOString();
  }

  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid timestamp "${timestamp}". Use ISO 8601.`);
  }

  return timestamp;
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
  const severity = ensureSeverity(input.severity);
  const timestamp = resolveTimestamp(input.timestamp);

  return {
    id: generateAlertId(),
    source: input.source,
    message: input.message,
    severity,
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
  const normalizedMin = ensureSeverity(minSeverity);
  const minRank = severityRank(normalizedMin);

  return alerts.filter((alert) => {
    const severity = ensureSeverity(alert.severity);
    return severityRank(severity) >= minRank;
  });
}
