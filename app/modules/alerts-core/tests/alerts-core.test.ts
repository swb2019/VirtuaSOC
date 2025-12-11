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

function createSampleAlerts(): SecurityAlert[] {
  return [
    createAlert({
      source: "siem",
      message: "Low severity",
      severity: "low",
      timestamp: "2025-01-01T00:00:00.000Z",
    }),
    createAlert({
      source: "siem",
      message: "Medium severity",
      severity: "medium",
      timestamp: "2025-01-01T01:00:00.000Z",
    }),
    createAlert({
      source: "siem",
      message: "High severity",
      severity: "high",
      timestamp: "2025-01-01T02:00:00.000Z",
    }),
    createAlert({
      source: "siem",
      message: "Critical severity",
      severity: "critical",
      timestamp: "2025-01-01T03:00:00.000Z",
    }),
  ];
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

  SEVERITY_ORDER.forEach((threshold) => {
    it(`filters alerts with minimum severity ${threshold}`, () => {
      const alerts = createSampleAlerts();
      const filtered = filterAlertsBySeverity(alerts, threshold);
      expect(
        filtered.every(
          (a) => indexOfSeverity(a.severity) >= indexOfSeverity(threshold),
        ),
      ).toBe(true);
      expect(filtered.map((a) => a.severity)).toEqual(
        SEVERITY_ORDER.filter(
          (level) => indexOfSeverity(level) >= indexOfSeverity(threshold),
        ),
      );
    });
  });

  it("throws when createAlert receives an invalid severity", () => {
    expect(() =>
      createAlert({
        source: "siem",
        message: "Bad severity",
        severity: "urgent" as Severity,
      }),
    ).toThrowError(/Invalid alert severity/);
  });

  it("throws when filtering with an unknown minimum severity", () => {
    const alerts = createSampleAlerts();
    expect(() =>
      filterAlertsBySeverity(alerts, "unknown" as Severity),
    ).toThrowError(/Invalid minimum severity/);
  });
});
