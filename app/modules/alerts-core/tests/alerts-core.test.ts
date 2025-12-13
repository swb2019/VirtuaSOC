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

afterEach(() => {
  vi.useRealTimers();
});

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

    it.each(["", "   "])(
      "falls back to generated timestamp when timestamp is '%s'",
      (timestampInput) => {
        const fixedDate = new Date("2025-01-01T00:00:00.000Z");
        vi.useFakeTimers();
        vi.setSystemTime(fixedDate);

        const alert = createAlert({
          source: "ids",
          message: "Whitespace timestamp",
          severity: "medium",
          timestamp: timestampInput,
        });

        expect(alert.timestamp).toBe(fixedDate.toISOString());
      },
    );
  });

  describe("filterAlertsBySeverity", () => {
    const sampleAlerts: SecurityAlert[] = [
      createAlert({
        source: "siem",
        message: "Low alert",
        severity: "low",
      }),
      createAlert({
        source: "siem",
        message: "Medium alert",
        severity: "medium",
      }),
      createAlert({
        source: "siem",
        message: "High alert",
        severity: "high",
      }),
      createAlert({
        source: "siem",
        message: "Critical alert",
        severity: "critical",
      }),
    ];

    it.each([
      ["low", ["low", "medium", "high", "critical"]],
      ["medium", ["medium", "high", "critical"]],
      ["high", ["high", "critical"]],
      ["critical", ["critical"]],
    ] as Array<[Severity, Severity[]]>)(
      "returns alerts whose severity is >= %s",
      (threshold, expected) => {
        const filtered = filterAlertsBySeverity(sampleAlerts, threshold);
        expect(filtered.map((alert) => alert.severity)).toEqual(expected);
      },
    );

    it("preserves original order for matching alerts", () => {
      const alerts: SecurityAlert[] = [
        createAlert({
          source: "siem",
          message: "Medium 1",
          severity: "medium",
        }),
        createAlert({
          source: "siem",
          message: "Low 1",
          severity: "low",
        }),
        createAlert({
          source: "siem",
          message: "Critical 1",
          severity: "critical",
        }),
        createAlert({
          source: "siem",
          message: "High 1",
          severity: "high",
        }),
        createAlert({
          source: "siem",
          message: "Medium 2",
          severity: "medium",
        }),
      ];

      const filtered = filterAlertsBySeverity(alerts, "medium");
      expect(filtered.map((alert) => alert.message)).toEqual([
        "Medium 1",
        "Critical 1",
        "High 1",
        "Medium 2",
      ]);
    });
  });
});
