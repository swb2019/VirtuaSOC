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
    message: "Info",
    severity: "low",
  }),
  createAlert({
    source: "siem",
    message: "Warning",
    severity: "medium",
  }),
  createAlert({
    source: "siem",
    message: "High",
    severity: "high",
  }),
  createAlert({
    source: "siem",
    message: "Critical issue",
    severity: "critical",
  }),
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

  it("trims whitespace around provided timestamp", () => {
    const alert = createAlert({
      source: "siem",
      message: "Whitespace timestamp",
      severity: "medium",
      timestamp: " 2025-11-30T00:00:00.000Z ",
    });
    expect(alert.timestamp).toBe("2025-11-30T00:00:00.000Z");
  });

  const severityExpectations: Record<Severity, string[]> = {
    low: ["Info", "Warning", "High", "Critical issue"],
    medium: ["Warning", "High", "Critical issue"],
    high: ["High", "Critical issue"],
    critical: ["Critical issue"],
  };

  (["low", "medium", "high", "critical"] as Severity[]).forEach(
    (minSeverity) => {
      it(`filters alerts by minimum severity (${minSeverity})`, () => {
        const filtered = filterAlertsBySeverity(SAMPLE_ALERTS, minSeverity);
        expect(filtered.map((alert) => alert.message)).toEqual(
          severityExpectations[minSeverity],
        );
        expect(
          filtered.every(
            (a) =>
              indexOfSeverity(a.severity) >= indexOfSeverity(minSeverity),
          ),
        ).toBe(true);
      });
    }
  );
});
