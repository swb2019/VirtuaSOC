import { describe, it, expect, vi } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

function indexOfSeverity(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

function buildAlert(
  id: string,
  severity: Severity,
  message: string,
  timestamp: string,
): SecurityAlert {
  return {
    id,
    source: "siem",
    message,
    severity,
    timestamp,
  };
}

describe("alerts-core", () => {
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

    it("falls back to a generated timestamp when provided timestamp is blank", () => {
      vi.useFakeTimers();
      const frozen = new Date("2025-02-01T08:00:00.000Z");
      vi.setSystemTime(frozen);

      try {
        const alert = createAlert({
          source: "fusion",
          message: "Blank timestamp",
          severity: "medium",
          timestamp: "   ",
        });
        expect(alert.timestamp).toBe(frozen.toISOString());
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("filterAlertsBySeverity", () => {
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
          (alert) =>
            indexOfSeverity(alert.severity) >= indexOfSeverity("high"),
        ),
      ).toBe(true);
    });

    it("filters alerts at every severity threshold", () => {
      const alerts: SecurityAlert[] = SEVERITY_ORDER.map((severity, idx) =>
        buildAlert(
          `alert-${idx}`,
          severity,
          `${severity} alert`,
          `2025-01-0${idx + 1}T00:00:00.000Z`,
        ),
      );

      SEVERITY_ORDER.forEach((threshold) => {
        const filtered = filterAlertsBySeverity(alerts, threshold);
        const expected = alerts
          .filter(
            (alert) =>
              indexOfSeverity(alert.severity) >= indexOfSeverity(threshold),
          )
          .map((alert) => alert.id);

        expect(filtered.map((alert) => alert.id)).toEqual(expected);
      });
    });

    it("preserves alert order when filtering", () => {
      const alerts: SecurityAlert[] = [
        buildAlert(
          "critical-first",
          "critical",
          "critical should stay first",
          "2025-01-01T00:00:00.000Z",
        ),
        buildAlert(
          "low-middle",
          "low",
          "low severity should be filtered out",
          "2025-01-02T00:00:00.000Z",
        ),
        buildAlert(
          "medium-late",
          "medium",
          "medium should remain after low is filtered",
          "2025-01-03T00:00:00.000Z",
        ),
        buildAlert(
          "high-last",
          "high",
          "high should stay last",
          "2025-01-04T00:00:00.000Z",
        ),
      ];

      const filtered = filterAlertsBySeverity(alerts, "medium");
      expect(filtered.map((alert) => alert.id)).toEqual([
        "critical-first",
        "medium-late",
        "high-last",
      ]);
    });
  });
});
