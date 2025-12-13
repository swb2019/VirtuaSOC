import { describe, it, expect } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

function indexOfSeverity(s: Severity): number {
  return SEVERITY_ORDER.indexOf(s);
}

const SAMPLE_ALERTS: SecurityAlert[] = [
  createAlert({
    source: "siem",
    message: "Low signal",
    severity: "low",
    timestamp: "2025-01-01T00:00:00.000Z",
  }),
  createAlert({
    source: "siem",
    message: "Medium signal",
    severity: "medium",
    timestamp: "2025-01-02T00:00:00.000Z",
  }),
  createAlert({
    source: "soc",
    message: "High alert",
    severity: "high",
    timestamp: "2025-01-03T00:00:00.000Z",
  }),
  createAlert({
    source: "eds",
    message: "Critical alert",
    severity: "critical",
    timestamp: "2025-01-04T00:00:00.000Z",
  }),
];

const SEVERITY_CASES: Array<{
  minSeverity: Severity;
  expectedSeverities: Severity[];
}> = [
  {
    minSeverity: "low",
    expectedSeverities: ["low", "medium", "high", "critical"],
  },
  { minSeverity: "medium", expectedSeverities: ["medium", "high", "critical"] },
  { minSeverity: "high", expectedSeverities: ["high", "critical"] },
  { minSeverity: "critical", expectedSeverities: ["critical"] },
];

describe("alerts-core", () => {
  it("creates an alert with generated timestamp when not provided", () => {
    const alert = createAlert({
      source: "eds",
      message: "Suspicious login",
      severity: "high",
    });

    expect(alert.id).toBeTypeOf("string");
    expect(alert.id.length).toBeGreaterThan(0);
    expect(alert.source).toBe("eds");
    expect(alert.message).toBe("Suspicious login");
    expect(alert.severity).toBe("high");

    const date = new Date(alert.timestamp);
    expect(isNaN(date.getTime())).toBe(false);
  });

  it("respects provided timestamp", () => {
    const ts = "2025-11-30T00:00:00.000Z";
    const alert = createAlert({
      source: "siem",
      message: "Test alert",
      severity: "low",
      timestamp: ts,
    });
    expect(alert.timestamp).toBe(ts);
  });

  it.each(SEVERITY_CASES)(
    "filters alerts when minimum severity is %s",
    ({ minSeverity, expectedSeverities }) => {
      const filtered = filterAlertsBySeverity(SAMPLE_ALERTS, minSeverity);

      expect(filtered.map((alert) => alert.severity)).toEqual(
        expectedSeverities,
      );
      expect(
        filtered.every(
          (alert) =>
            indexOfSeverity(alert.severity) >= indexOfSeverity(minSeverity),
        ),
      ).toBe(true);
    },
  );
});
