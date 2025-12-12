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

const BASE_SOURCE = "siem";
const BASE_MESSAGE = "Base alert";

function makeAlert(severity: Severity, messageSuffix: string): SecurityAlert {
  return createAlert({
    source: `${BASE_SOURCE}-${messageSuffix}`,
    message: `${BASE_MESSAGE}-${messageSuffix}`,
    severity,
  });
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

  it("falls back to generated timestamp when provided value is whitespace", () => {
    const whitespaceTimestamp = "   ";
    const alert = createAlert({
      source: "siem",
      message: "Whitespace timestamp",
      severity: "medium",
      timestamp: whitespaceTimestamp,
    });

    expect(alert.timestamp).not.toBe(whitespaceTimestamp);
    expect(new Date(alert.timestamp).toString()).not.toBe("Invalid Date");
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

  it("preserves alert ordering when filtering", () => {
    const alerts: SecurityAlert[] = [
      makeAlert("critical", "critical-1"),
      makeAlert("medium", "medium-1"),
      makeAlert("critical", "critical-2"),
      makeAlert("high", "high-1"),
    ];

    const filtered = filterAlertsBySeverity(alerts, "high");
    expect(filtered.map((alert) => alert.message)).toEqual([
      `${BASE_MESSAGE}-critical-1`,
      `${BASE_MESSAGE}-critical-2`,
      `${BASE_MESSAGE}-high-1`,
    ]);
  });

  it.each([
    ["low", ["low", "medium", "high", "critical"]],
    ["medium", ["medium", "high", "critical"]],
    ["high", ["high", "critical"]],
    ["critical", ["critical"]],
  ] satisfies Array<[Severity, Severity[]]>)(
    "filters correctly for min severity %s",
    (threshold, expectedSeverities) => {
      const alerts = SEVERITY_ORDER.map((severity, index) =>
        makeAlert(severity, `${threshold}-${index}`),
      );

      const filtered = filterAlertsBySeverity(alerts, threshold);
      expect(filtered.map((alert) => alert.severity)).toEqual(
        expectedSeverities,
      );
    },
  );
});
