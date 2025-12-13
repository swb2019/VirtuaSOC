import { describe, it, expect, vi } from "vitest";
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

function buildSampleAlerts(): SecurityAlert[] {
  return SEVERITY_ORDER.map((severity, index) =>
    createAlert({
      source: `siem-${severity}`,
      message: `${severity.toUpperCase()}_${index}`,
      severity,
      timestamp: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
    }),
  );
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

  it("falls back to current timestamp when provided value is only whitespace", () => {
    const frozenTime = new Date("2025-12-01T12:30:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(frozenTime);

    try {
      const alert = createAlert({
        source: "manual",
        message: "Blank timestamp should default",
        severity: "medium",
        timestamp: "   ",
      });

      expect(alert.timestamp).toBe(frozenTime.toISOString());
    } finally {
      vi.useRealTimers();
    }
  });

  it("filters alerts at each severity threshold", () => {
    const alerts = buildSampleAlerts();

    const expectations: Record<Severity, Severity[]> = {
      low: ["low", "medium", "high", "critical"],
      medium: ["medium", "high", "critical"],
      high: ["high", "critical"],
      critical: ["critical"],
    };

    SEVERITY_ORDER.forEach((threshold) => {
      const filtered = filterAlertsBySeverity(alerts, threshold);
      expect(filtered.map((a) => a.severity)).toEqual(expectations[threshold]);
    });
  });

  it("preserves alert order when filtering", () => {
    const alerts: SecurityAlert[] = [
      createAlert({
        source: "siem",
        message: "Medium first",
        severity: "medium",
        timestamp: "2025-01-01T00:00:00.000Z",
      }),
      createAlert({
        source: "siem",
        message: "Critical second",
        severity: "critical",
        timestamp: "2025-01-01T01:00:00.000Z",
      }),
      createAlert({
        source: "siem",
        message: "High third",
        severity: "high",
        timestamp: "2025-01-01T02:00:00.000Z",
      }),
    ];

    const filtered = filterAlertsBySeverity(alerts, "medium");
    expect(filtered.map((alert) => alert.id)).toEqual(
      alerts.map((alert) => alert.id),
    );
  });
});
