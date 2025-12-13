import { describe, it, expect } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

function staticAlert(severity: Severity, index: number): SecurityAlert {
  return {
    id: `alert-${index}`,
    source: "siem",
    message: `${severity} alert`,
    severity,
    timestamp: `2025-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
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

    it("replaces blank timestamps with generated ISO strings", () => {
      const alert = createAlert({
        source: "hunting",
        message: "Whitespace timestamp",
        severity: "medium",
        timestamp: "   ",
      });

      expect(alert.timestamp.trim().length).toBeGreaterThan(0);
      expect(alert.timestamp).not.toBe("   ");
      expect(new Date(alert.timestamp).toString()).not.toBe("Invalid Date");
    });
  });

  describe("filterAlertsBySeverity", () => {
    const baseAlerts = SEVERITY_ORDER.map((severity, index) =>
      staticAlert(severity, index),
    );

    it.each([
      ["low", ["low", "medium", "high", "critical"]],
      ["medium", ["medium", "high", "critical"]],
      ["high", ["high", "critical"]],
      ["critical", ["critical"]],
    ] as [Severity, Severity[]][])(
      "returns alerts whose severity is >= %s",
      (minSeverity, expectedSeverities) => {
        const alerts = baseAlerts.map((alert) => ({ ...alert }));
        const filtered = filterAlertsBySeverity(alerts, minSeverity);
        expect(filtered.map((alert) => alert.severity)).toEqual(
          expectedSeverities,
        );
      },
    );

    it("preserves original order when filtering", () => {
      const scrambled: SecurityAlert[] = [
        staticAlert("high", 0),
        staticAlert("low", 1),
        staticAlert("critical", 2),
        staticAlert("medium", 3),
      ];

      const filtered = filterAlertsBySeverity(scrambled, "medium");
      expect(filtered.map((alert) => alert.id)).toEqual([
        "alert-0",
        "alert-2",
        "alert-3",
      ]);
    });
  });
});
