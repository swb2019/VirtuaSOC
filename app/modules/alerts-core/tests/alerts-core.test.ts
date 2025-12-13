import { describe, it, expect } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

const buildAlerts = (): SecurityAlert[] => [
  createAlert({
    source: "siem",
    message: "Low alert",
    severity: "low",
  }),
  createAlert({
    source: "siem",
    message: "Medium alert",
    severity: "medium",
  }),
  createAlert({
    source: "siem",
    message: "High alert",
    severity: "high",
  }),
  createAlert({
    source: "siem",
    message: "Critical alert",
    severity: "critical",
  }),
];

describe("createAlert", () => {
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

  it("rejects invalid severities", () => {
    expect(() =>
      createAlert({
        source: "siem",
        message: "Bad severity",
        severity: "urgent" as Severity,
      }),
    ).toThrowError(/Invalid severity/i);
  });

  it("rejects invalid timestamps", () => {
    expect(() =>
      createAlert({
        source: "siem",
        message: "Bad timestamp",
        severity: "low",
        timestamp: "not-a-date",
      }),
    ).toThrowError(/Invalid timestamp/i);
  });
});

describe("filterAlertsBySeverity", () => {
  it.each([
    ["low", ["low", "medium", "high", "critical"]],
    ["medium", ["medium", "high", "critical"]],
    ["high", ["high", "critical"]],
    ["critical", ["critical"]],
  ] as const)(
    "returns alerts with severity >= %s",
    (threshold, expectedSeverities) => {
      const alerts = buildAlerts();
      const filtered = filterAlertsBySeverity(alerts, threshold);
      expect(filtered.map((alert) => alert.severity)).toEqual(
        expectedSeverities,
      );
    },
  );

  it("throws when min severity is invalid", () => {
    const alerts = buildAlerts();
    expect(() =>
      filterAlertsBySeverity(alerts, "urgent" as Severity),
    ).toThrowError(/Invalid severity/i);
  });

  it("throws when an alert carries an invalid severity", () => {
    const invalidAlert: any = {
      id: "invalid",
      source: "siem",
      message: "Bad data",
      severity: "unknown",
      timestamp: new Date().toISOString(),
    };

    expect(() =>
      filterAlertsBySeverity([invalidAlert], "low"),
    ).toThrowError(/Invalid severity/i);
  });
});
