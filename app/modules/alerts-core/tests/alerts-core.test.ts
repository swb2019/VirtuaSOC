import { describe, it, expect } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

const ALERT_FIXTURE: SecurityAlert[] = [
  {
    id: "a1",
    source: "siem",
    message: "Low severity",
    severity: "low",
    timestamp: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "b2",
    source: "siem",
    message: "Medium severity",
    severity: "medium",
    timestamp: "2025-01-02T00:00:00.000Z",
  },
  {
    id: "c3",
    source: "siem",
    message: "High severity",
    severity: "high",
    timestamp: "2025-01-03T00:00:00.000Z",
  },
  {
    id: "d4",
    source: "siem",
    message: "Critical severity",
    severity: "critical",
    timestamp: "2025-01-04T00:00:00.000Z",
  },
];

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

  it("falls back to current timestamp when provided timestamp is whitespace", () => {
    const alert = createAlert({
      source: "dr",
      message: "Whitespace timestamp",
      severity: "medium",
      timestamp: "\n   \t",
    });

    expect(alert.timestamp.trim().length).toBeGreaterThan(0);
    expect(alert.timestamp).not.toBe("\n   \t");
    expect(isNaN(new Date(alert.timestamp).getTime())).toBe(false);
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

  describe.each<
    [Severity, Severity[]]
  >([
    ["low", ["low", "medium", "high", "critical"]],
    ["medium", ["medium", "high", "critical"]],
    ["high", ["high", "critical"]],
    ["critical", ["critical"]],
  ])("filterAlertsBySeverity at %s threshold", (threshold, expected) => {
    it(`returns alerts with severity >= ${threshold}`, () => {
      const filtered = filterAlertsBySeverity(ALERT_FIXTURE, threshold);
      expect(filtered.map((a) => a.severity)).toEqual(expected);
    });
  });

  it("preserves the original alert order when filtering", () => {
    const alerts: SecurityAlert[] = [
      {
        id: "order-1",
        source: "siem",
        message: "Medium first",
        severity: "medium",
        timestamp: "2025-02-01T00:00:00.000Z",
      },
      {
        id: "order-2",
        source: "siem",
        message: "Critical second",
        severity: "critical",
        timestamp: "2025-02-02T00:00:00.000Z",
      },
      {
        id: "order-3",
        source: "siem",
        message: "Low third",
        severity: "low",
        timestamp: "2025-02-03T00:00:00.000Z",
      },
      {
        id: "order-4",
        source: "siem",
        message: "High fourth",
        severity: "high",
        timestamp: "2025-02-04T00:00:00.000Z",
      },
    ];

    const filtered = filterAlertsBySeverity(alerts, "medium");

    expect(filtered).toHaveLength(3);
    expect(filtered[0]).toBe(alerts[0]);
    expect(filtered[1]).toBe(alerts[1]);
    expect(filtered[2]).toBe(alerts[3]);
  });
});
