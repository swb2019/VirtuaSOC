import { describe, it, expect, afterEach, vi } from "vitest";
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

  describe("createAlert", () => {
    it("creates an alert with generated timestamp when not provided", () => {
      const fixedDate = new Date("2025-12-01T12:00:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(fixedDate);

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
      expect(alert.timestamp).toBe(fixedDate.toISOString());
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

    it("treats blank timestamps as missing and uses the current time", () => {
      const fixedDate = new Date("2025-12-02T08:30:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(fixedDate);

      const alert = createAlert({
        source: "siem",
        message: "Blank timestamp",
        severity: "medium",
        timestamp: "   ",
      });

      expect(alert.timestamp).toBe(fixedDate.toISOString());
    });
  });

  describe("filterAlertsBySeverity", () => {
    const sampleAlerts: SecurityAlert[] = [
      {
        id: "a-low",
        source: "sensor",
        message: "Low issue",
        severity: "low",
        timestamp: "2025-12-01T00:00:00.000Z",
      },
      {
        id: "a-medium",
        source: "sensor",
        message: "Medium issue",
        severity: "medium",
        timestamp: "2025-12-01T01:00:00.000Z",
      },
      {
        id: "a-high",
        source: "sensor",
        message: "High issue",
        severity: "high",
        timestamp: "2025-12-01T02:00:00.000Z",
      },
      {
        id: "a-critical",
        source: "sensor",
        message: "Critical issue",
        severity: "critical",
        timestamp: "2025-12-01T03:00:00.000Z",
      },
    ];

    it.each([
      ["low", ["low", "medium", "high", "critical"]],
      ["medium", ["medium", "high", "critical"]],
      ["high", ["high", "critical"]],
      ["critical", ["critical"]],
    ] as Array<[Severity, Severity[]]>)(
      "filters alerts by minimum severity %s",
      (minSeverity, expectedSeverities) => {
        const filtered = filterAlertsBySeverity(sampleAlerts, minSeverity);
        expect(filtered.map((alert) => alert.severity)).toEqual(
          expectedSeverities,
        );
      },
    );

    it("preserves the original order of alerts when filtering", () => {
      const unorderedAlerts: SecurityAlert[] = [
        {
          id: "medium-1",
          source: "sensor",
          message: "Medium issue",
          severity: "medium",
          timestamp: "2025-12-01T04:00:00.000Z",
        },
        {
          id: "critical-1",
          source: "sensor",
          message: "Critical issue",
          severity: "critical",
          timestamp: "2025-12-01T05:00:00.000Z",
        },
        {
          id: "high-1",
          source: "sensor",
          message: "High issue",
          severity: "high",
          timestamp: "2025-12-01T06:00:00.000Z",
        },
      ];

      const filtered = filterAlertsBySeverity(unorderedAlerts, "high");
      expect(filtered.map((alert) => alert.id)).toEqual([
        "critical-1",
        "high-1",
      ]);
      expect(
        filtered.every(
          (alert) => indexOfSeverity(alert.severity) >= indexOfSeverity("high"),
        ),
      ).toBe(true);
    });
  });
});
