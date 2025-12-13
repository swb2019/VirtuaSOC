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

  it("trims provided timestamp before storing", () => {
    const ts = " 2025-11-30T00:00:00.000Z  ";
    const alert = createAlert({
      source: "siem",
      message: "Timestamp with whitespace",
      severity: "medium",
      timestamp: ts,
    });
    expect(alert.timestamp).toBe("2025-11-30T00:00:00.000Z");
  });

  it("throws when provided timestamp is invalid", () => {
    expect(() =>
      createAlert({
        source: "siem",
        message: "Bad timestamp",
        severity: "medium",
        timestamp: "not-a-date",
      }),
    ).toThrow(/timestamp/i);
  });

  it("filters alerts by minimum severity", () => {
    const alerts: SecurityAlert[] = [
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
        message: "Critical issue",
        severity: "critical",
      }),
    ];

    const filtered = filterAlertsBySeverity(alerts, "high");
    expect(
      filtered.every(
        (a) => indexOfSeverity(a.severity) >= indexOfSeverity("high"),
      ),
    ).toBe(true);
  });
});
