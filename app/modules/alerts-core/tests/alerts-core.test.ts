import { describe, it, expect } from "vitest";
import { createAlert, filterAlertsBySeverity, Severity } from "../src";

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

  it("filters alerts by minimum severity", () => {
    const alerts = [
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

  it("throws when createAlert receives an invalid severity", () => {
    expect(() =>
      createAlert({
        source: "soc",
        message: "Bad data",
        severity: "urgent" as Severity,
      }),
    ).toThrow(/invalid severity/i);
  });

  it("throws when filtering with an invalid minimum severity", () => {
    const alerts = [
      createAlert({
        source: "siem",
        message: "Critical issue",
        severity: "critical",
      }),
    ];

    expect(() =>
      filterAlertsBySeverity(alerts, "urgent" as Severity),
    ).toThrow(/invalid severity/i);
  });

  it("throws when any alert carries an invalid severity value", () => {
    const invalidAlerts = JSON.parse(
      JSON.stringify([
        {
          id: "invalid",
          source: "siem",
          message: "bad",
          severity: "urgent",
          timestamp: new Date().toISOString(),
        },
      ]),
    );

    const unsafeFilter = filterAlertsBySeverity as (
      alerts: unknown,
      minSeverity: unknown,
    ) => unknown;

    expect(() => unsafeFilter(invalidAlerts, "low")).toThrow(
      /invalid severity/i,
    );
  });
});
