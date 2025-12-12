import { describe, it, expect, vi } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  SecurityAlert,
} from "../src";

const SAMPLE_ALERTS: SecurityAlert[] = [
  {
    id: "alert-low",
    source: "siem",
    message: "Informational",
    severity: "low",
    timestamp: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "alert-medium",
    source: "siem",
    message: "Warning",
    severity: "medium",
    timestamp: "2025-01-02T00:00:00.000Z",
  },
  {
    id: "alert-high",
    source: "siem",
    message: "High severity",
    severity: "high",
    timestamp: "2025-01-03T00:00:00.000Z",
  },
  {
    id: "alert-critical",
    source: "siem",
    message: "Critical outage",
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

  it("trims provided timestamp input", () => {
    const alert = createAlert({
      source: "ops",
      message: "Needs trim",
      severity: "medium",
      timestamp: " 2025-12-11T00:00:00.000Z ",
    });

    expect(alert.timestamp).toBe("2025-12-11T00:00:00.000Z");
  });

  it("falls back to generated timestamp when timestamp is whitespace", () => {
    vi.useFakeTimers();
    const fixedDate = new Date("2025-01-05T12:34:56.000Z");
    vi.setSystemTime(fixedDate);

    try {
      const alert = createAlert({
        source: "ops",
        message: "Missing timestamp",
        severity: "high",
        timestamp: "   ",
      });

      expect(alert.timestamp).toBe(fixedDate.toISOString());
    } finally {
      vi.useRealTimers();
    }
  });

  it("filters alerts by each minimum severity threshold", () => {
    const lowPlus = filterAlertsBySeverity(SAMPLE_ALERTS, "low");
    expect(lowPlus.map((a) => a.id)).toEqual([
      "alert-low",
      "alert-medium",
      "alert-high",
      "alert-critical",
    ]);

    const mediumPlus = filterAlertsBySeverity(SAMPLE_ALERTS, "medium");
    expect(mediumPlus.map((a) => a.id)).toEqual([
      "alert-medium",
      "alert-high",
      "alert-critical",
    ]);

    const highPlus = filterAlertsBySeverity(SAMPLE_ALERTS, "high");
    expect(highPlus.map((a) => a.id)).toEqual([
      "alert-high",
      "alert-critical",
    ]);

    const criticalOnly = filterAlertsBySeverity(SAMPLE_ALERTS, "critical");
    expect(criticalOnly.map((a) => a.id)).toEqual(["alert-critical"]);
  });
});
