import { describe, it, expect } from "vitest";
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

    it("trims any surrounding whitespace on provided timestamp", () => {
      const tsWithWhitespace = "  2025-12-01T12:00:00.000Z  ";
      const alert = createAlert({
        source: "soc",
        message: "Whitespace timestamp",
        severity: "medium",
        timestamp: tsWithWhitespace,
      });

      expect(alert.timestamp).toBe(tsWithWhitespace.trim());
    });
  });

  describe("filterAlertsBySeverity", () => {
    const sampleAlerts: SecurityAlert[] = [
      createAlert({
        source: "siem",
        message: "Low alert",
        severity: "low",
        timestamp: "2025-01-01T00:00:00.000Z",
      }),
      createAlert({
        source: "siem",
        message: "Medium alert",
        severity: "medium",
        timestamp: "2025-01-02T00:00:00.000Z",
      }),
      createAlert({
        source: "siem",
        message: "High alert",
        severity: "high",
        timestamp: "2025-01-03T00:00:00.000Z",
      }),
      createAlert({
        source: "siem",
        message: "Critical alert",
        severity: "critical",
        timestamp: "2025-01-04T00:00:00.000Z",
      }),
    ];

    const thresholdExpectations: Array<[Severity, Severity[]]> = [
      ["low", ["low", "medium", "high", "critical"]],
      ["medium", ["medium", "high", "critical"]],
      ["high", ["high", "critical"]],
      ["critical", ["critical"]],
    ];

    it.each(thresholdExpectations)(
      "returns alerts whose severity is >= %s",
      (threshold, expectedSeverities) => {
        const filtered = filterAlertsBySeverity(sampleAlerts, threshold);
        expect(filtered.map((a) => a.severity)).toEqual(expectedSeverities);
      },
    );

    it("preserves the original order of alerts", () => {
      const filtered = filterAlertsBySeverity(sampleAlerts, "medium");
      expect(filtered.map((alert) => alert.message)).toEqual([
        "Medium alert",
        "High alert",
        "Critical alert",
      ]);
    });
  });
});
