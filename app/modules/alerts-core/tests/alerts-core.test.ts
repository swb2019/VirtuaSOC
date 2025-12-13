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

  describe("filterAlertsBySeverity", () => {
    const orderedAlerts: SecurityAlert[] = SEVERITY_ORDER.map(
      (severity, idx) =>
        createAlert({
          source: `siem-${idx}`,
          message: `${severity}-alert-${idx}`,
          severity,
        }),
    );

    SEVERITY_ORDER.forEach((threshold) => {
      it(`returns alerts at or above ${threshold}`, () => {
        const filtered = filterAlertsBySeverity(orderedAlerts, threshold);
        const expected = orderedAlerts.filter(
          (alert) =>
            indexOfSeverity(alert.severity) >= indexOfSeverity(threshold),
        );

        expect(filtered).toEqual(expected);
      });
    });

    it("preserves the original ordering of matching alerts", () => {
      const mixedAlerts: SecurityAlert[] = [
        createAlert({
          source: "siem",
          message: "low-1",
          severity: "low",
        }),
        createAlert({
          source: "siem",
          message: "medium-1",
          severity: "medium",
        }),
        createAlert({
          source: "siem",
          message: "high-1",
          severity: "high",
        }),
        createAlert({
          source: "siem",
          message: "medium-2",
          severity: "medium",
        }),
        createAlert({
          source: "siem",
          message: "critical-1",
          severity: "critical",
        }),
      ];

      const filtered = filterAlertsBySeverity(mixedAlerts, "medium");
      expect(filtered.map((alert) => alert.message)).toEqual([
        "medium-1",
        "high-1",
        "medium-2",
        "critical-1",
      ]);
    });
  });
});
