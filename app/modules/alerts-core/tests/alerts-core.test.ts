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

  it("filters alerts by each severity threshold and returns them ordered", () => {
    const sampleSeverities: Severity[] = [
      "critical",
      "low",
      "medium",
      "high",
      "critical",
      "medium",
    ];
    const alerts: SecurityAlert[] = sampleSeverities.map((severity, idx) =>
      createAlert({
        source: "siem",
        message: `Alert ${idx}`,
        severity,
      }),
    );

    const cases: Array<[Severity, Severity[]]> = [
      ["low", ["low", "medium", "medium", "high", "critical", "critical"]],
      ["medium", ["medium", "medium", "high", "critical", "critical"]],
      ["high", ["high", "critical", "critical"]],
      ["critical", ["critical", "critical"]],
    ];

    cases.forEach(([threshold, expectedSeverities]) => {
      const filtered = filterAlertsBySeverity(alerts, threshold);
      expect(filtered.map((a) => a.severity)).toEqual(expectedSeverities);
    });
  });
});
