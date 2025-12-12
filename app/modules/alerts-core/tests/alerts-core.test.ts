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

  it("normalizes whitespace-padded timestamps", () => {
    const rawTs = " 2025-10-02T05:06:07Z  ";
    const expected = new Date("2025-10-02T05:06:07Z").toISOString();
    const alert = createAlert({
      source: "edr",
      message: "Whitespaced timestamp",
      severity: "medium",
      timestamp: rawTs,
    });
    expect(alert.timestamp).toBe(expected);
  });

  it("falls back to generated timestamp when provided timestamp is invalid", () => {
    const fixedNow = new Date("2025-12-01T12:34:56.789Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    try {
      const alert = createAlert({
        source: "eds",
        message: "Bad timestamp",
        severity: "high",
        timestamp: "not-a-date",
      });
      expect(alert.timestamp).toBe(fixedNow.toISOString());
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats blank timestamp as missing input", () => {
    const fixedNow = new Date("2025-12-05T08:09:10.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    try {
      const alert = createAlert({
        source: "soar",
        message: "Blank timestamp",
        severity: "critical",
        timestamp: "   ",
      });
      expect(alert.timestamp).toBe(fixedNow.toISOString());
    } finally {
      vi.useRealTimers();
    }
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
