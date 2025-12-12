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

    it("trims provided timestamp before storing", () => {
      const rawTimestamp = " 2025-10-10T05:00:00.000Z  ";
      const alert = createAlert({
        source: "siem",
        message: "Whitespace timestamp",
        severity: "medium",
        timestamp: rawTimestamp,
      });

      expect(alert.timestamp).toBe(rawTimestamp.trim());
    });

    it("falls back to generated timestamp when provided timestamp is blank", () => {
      const fixedNow = new Date("2026-01-02T03:04:05.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(fixedNow);
      try {
        const alert = createAlert({
          source: "siem",
          message: "Empty timestamp",
          severity: "low",
          timestamp: "   ",
        });

        expect(alert.timestamp).toBe(fixedNow.toISOString());
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("filterAlertsBySeverity", () => {
    const alerts: SecurityAlert[] = [
      createAlert({
        source: "siem",
        message: "Info",
        severity: "low",
        timestamp: "2025-01-01T00:00:00.000Z",
      }),
      createAlert({
        source: "siem",
        message: "Warning",
        severity: "medium",
        timestamp: "2025-01-01T01:00:00.000Z",
      }),
      createAlert({
        source: "siem",
        message: "High alert",
        severity: "high",
        timestamp: "2025-01-01T02:00:00.000Z",
      }),
      createAlert({
        source: "siem",
        message: "Critical issue",
        severity: "critical",
        timestamp: "2025-01-01T03:00:00.000Z",
      }),
    ];

    const expectations: Record<Severity, Severity[]> = {
      low: ["low", "medium", "high", "critical"],
      medium: ["medium", "high", "critical"],
      high: ["high", "critical"],
      critical: ["critical"],
    };

    SEVERITY_ORDER.forEach((threshold) => {
      it(`returns alerts for minimum severity "${threshold}"`, () => {
        const filtered = filterAlertsBySeverity(alerts, threshold);
        expect(filtered.map((alert) => alert.severity)).toEqual(
          expectations[threshold],
        );
      });
    });

    it("preserves order while filtering", () => {
      const filtered = filterAlertsBySeverity(alerts, "medium");
      expect(filtered).toEqual([
        expect.objectContaining({ severity: "medium", message: "Warning" }),
        expect.objectContaining({ severity: "high", message: "High alert" }),
        expect.objectContaining({
          severity: "critical",
          message: "Critical issue",
        }),
      ]);
    });
  });
});
