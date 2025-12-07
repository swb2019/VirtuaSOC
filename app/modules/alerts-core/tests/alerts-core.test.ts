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

    it("generates timestamp when provided empty string", () => {
      const alert = createAlert({
        source: "firewall",
        message: "Empty timestamp test",
        severity: "medium",
        timestamp: "",
      });

      expect(alert.timestamp).not.toBe("");
      const date = new Date(alert.timestamp);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it("generates timestamp when provided whitespace-only string", () => {
      const alert = createAlert({
        source: "firewall",
        message: "Whitespace timestamp test",
        severity: "medium",
        timestamp: "   ",
      });

      expect(alert.timestamp.trim()).not.toBe("");
      const date = new Date(alert.timestamp);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it("generates unique IDs for each alert", () => {
      const alert1 = createAlert({
        source: "siem",
        message: "Alert 1",
        severity: "low",
      });
      const alert2 = createAlert({
        source: "siem",
        message: "Alert 2",
        severity: "low",
      });

      expect(alert1.id).not.toBe(alert2.id);
    });
  });

  describe("filterAlertsBySeverity", () => {
    // Create a consistent set of test alerts with all severity levels
    function createTestAlerts(): SecurityAlert[] {
      return [
        createAlert({ source: "siem", message: "Low alert", severity: "low" }),
        createAlert({ source: "siem", message: "Medium alert", severity: "medium" }),
        createAlert({ source: "siem", message: "High alert", severity: "high" }),
        createAlert({ source: "siem", message: "Critical alert", severity: "critical" }),
      ];
    }

    it("filters alerts by minimum severity (basic test)", () => {
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

    it("filters with threshold 'low' - returns all alerts", () => {
      const alerts = createTestAlerts();
      const filtered = filterAlertsBySeverity(alerts, "low");

      expect(filtered).toHaveLength(4);
      expect(filtered.map((a) => a.severity)).toEqual([
        "low",
        "medium",
        "high",
        "critical",
      ]);
    });

    it("filters with threshold 'medium' - returns medium, high, critical", () => {
      const alerts = createTestAlerts();
      const filtered = filterAlertsBySeverity(alerts, "medium");

      expect(filtered).toHaveLength(3);
      expect(filtered.map((a) => a.severity)).toEqual([
        "medium",
        "high",
        "critical",
      ]);
    });

    it("filters with threshold 'high' - returns high, critical", () => {
      const alerts = createTestAlerts();
      const filtered = filterAlertsBySeverity(alerts, "high");

      expect(filtered).toHaveLength(2);
      expect(filtered.map((a) => a.severity)).toEqual(["high", "critical"]);
    });

    it("filters with threshold 'critical' - returns only critical", () => {
      const alerts = createTestAlerts();
      const filtered = filterAlertsBySeverity(alerts, "critical");

      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe("critical");
    });

    it("preserves input order when filtering", () => {
      // Create alerts in non-severity order to verify preservation
      const alerts: SecurityAlert[] = [
        createAlert({ source: "a", message: "Critical first", severity: "critical" }),
        createAlert({ source: "b", message: "Low second", severity: "low" }),
        createAlert({ source: "c", message: "High third", severity: "high" }),
        createAlert({ source: "d", message: "Medium fourth", severity: "medium" }),
        createAlert({ source: "e", message: "Critical fifth", severity: "critical" }),
      ];

      const filtered = filterAlertsBySeverity(alerts, "high");

      // Should get critical, high, critical in original order
      expect(filtered).toHaveLength(3);
      expect(filtered[0].source).toBe("a");
      expect(filtered[0].severity).toBe("critical");
      expect(filtered[1].source).toBe("c");
      expect(filtered[1].severity).toBe("high");
      expect(filtered[2].source).toBe("e");
      expect(filtered[2].severity).toBe("critical");
    });

    it("returns empty array when no alerts match", () => {
      const alerts: SecurityAlert[] = [
        createAlert({ source: "siem", message: "Low alert", severity: "low" }),
        createAlert({ source: "siem", message: "Medium alert", severity: "medium" }),
      ];

      const filtered = filterAlertsBySeverity(alerts, "critical");
      expect(filtered).toHaveLength(0);
    });

    it("handles empty input array", () => {
      const filtered = filterAlertsBySeverity([], "low");
      expect(filtered).toHaveLength(0);
    });
  });
});
