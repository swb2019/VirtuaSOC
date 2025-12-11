import { describe, it, expect } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

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

  it("filters alerts by every severity threshold and preserves ordering", () => {
    const alerts: SecurityAlert[] = [
      createAlert({
        source: "siem",
        message: "Low severity",
        severity: "low",
      }),
      createAlert({
        source: "siem",
        message: "Medium severity",
        severity: "medium",
      }),
      createAlert({
        source: "siem",
        message: "High severity",
        severity: "high",
      }),
      createAlert({
        source: "siem",
        message: "Critical severity",
        severity: "critical",
      }),
    ];

    const expectations: Record<Severity, Severity[]> = {
      low: ["low", "medium", "high", "critical"],
      medium: ["medium", "high", "critical"],
      high: ["high", "critical"],
      critical: ["critical"],
    };

    (Object.entries(expectations) as [Severity, Severity[]][]).forEach(
      ([threshold, expectedSeverities]) => {
        const filtered = filterAlertsBySeverity(alerts, threshold);
        expect(filtered.map((alert) => alert.severity)).toEqual(
          expectedSeverities,
        );
      },
    );
  });

  it("throws when createAlert receives an invalid severity", () => {
    expect(() =>
      createAlert({
        source: "eds",
        message: "Bad severity",
        severity: "urgent" as Severity,
      }),
    ).toThrow(/invalid severity/i);
  });

  it("throws when filterAlertsBySeverity receives invalid data", () => {
    const alerts: SecurityAlert[] = [
      createAlert({
        source: "siem",
        message: "Legit low",
        severity: "low",
      }),
    ];

    expect(() =>
      filterAlertsBySeverity(alerts, "urgent" as Severity),
    ).toThrow(/invalid severity/i);

    const invalidAlert = createAlert({
      source: "siem",
      message: "Invalid severity payload",
      severity: "low",
    });
    Reflect.set(invalidAlert, "severity", "urgent");

    expect(() =>
      filterAlertsBySeverity([invalidAlert], "low"),
    ).toThrow(/invalid severity/i);
  });
});
