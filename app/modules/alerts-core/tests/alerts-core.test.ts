import { describe, it, expect, vi, afterEach } from "vitest";
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("falls back to current time when timestamp is blank or whitespace", () => {
    const fixed = new Date("2025-12-11T22:45:00.000Z");
    vi.setSystemTime(fixed);
    const alert = createAlert({
      source: "soar",
      message: "Missing timestamp",
      severity: "medium",
      timestamp: "   ",
    });
    expect(alert.timestamp).toBe(fixed.toISOString());
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

  it("filters correctly for every severity threshold", () => {
    const alerts: SecurityAlert[] = SEVERITY_ORDER.map((severity, index) =>
      createAlert({
        source: "siem",
        message: `${severity}-${index}`,
        severity,
        timestamp: `2025-12-11T00:00:0${index}Z`,
      }),
    );

    const expected = {
      low: ["low", "medium", "high", "critical"],
      medium: ["medium", "high", "critical"],
      high: ["high", "critical"],
      critical: ["critical"],
    } as const;

    SEVERITY_ORDER.forEach((threshold) => {
      const filtered = filterAlertsBySeverity(alerts, threshold);
      expect(filtered.map((a) => a.severity)).toEqual(expected[threshold]);
    });
  });

  it("preserves the order of the original alerts when filtering", () => {
    const alerts: SecurityAlert[] = [
      createAlert({
        source: "siem",
        message: "low",
        severity: "low",
        timestamp: "2025-12-11T00:00:00Z",
      }),
      createAlert({
        source: "soar",
        message: "critical",
        severity: "critical",
        timestamp: "2025-12-11T00:00:01Z",
      }),
      createAlert({
        source: "eds",
        message: "medium",
        severity: "medium",
        timestamp: "2025-12-11T00:00:02Z",
      }),
      createAlert({
        source: "siem",
        message: "high",
        severity: "high",
        timestamp: "2025-12-11T00:00:03Z",
      }),
    ];

    const filtered = filterAlertsBySeverity(alerts, "medium");
    expect(filtered.map((a) => a.message)).toEqual(["critical", "medium", "high"]);
  });
});
