import { describe, it, expect } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

const FIXED_TIMESTAMP = "2025-01-01T00:00:00.000Z";
const SAMPLE_ALERTS: SecurityAlert[] = [
  {
    id: "alert-low",
    source: "siem",
    message: "Low severity event",
    severity: "low",
    timestamp: FIXED_TIMESTAMP,
  },
  {
    id: "alert-medium",
    source: "siem",
    message: "Medium severity event",
    severity: "medium",
    timestamp: FIXED_TIMESTAMP,
  },
  {
    id: "alert-high",
    source: "siem",
    message: "High severity event",
    severity: "high",
    timestamp: FIXED_TIMESTAMP,
  },
  {
    id: "alert-critical",
    source: "siem",
    message: "Critical severity event",
    severity: "critical",
    timestamp: FIXED_TIMESTAMP,
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

  it("rejects alerts with invalid severity input", () => {
    expect(() =>
      createAlert({
        source: "siem",
        message: "Bad severity",
        severity: "urgent" as Severity,
      }),
    ).toThrowError(/unknown severity/i);
  });

  describe("filterAlertsBySeverity", () => {
    const cases: Array<{ minSeverity: Severity; expected: Severity[] }> = [
      {
        minSeverity: "low",
        expected: ["low", "medium", "high", "critical"],
      },
      {
        minSeverity: "medium",
        expected: ["medium", "high", "critical"],
      },
      {
        minSeverity: "high",
        expected: ["high", "critical"],
      },
      {
        minSeverity: "critical",
        expected: ["critical"],
      },
    ];

    cases.forEach(({ minSeverity, expected }) => {
      it(`keeps alerts for minSeverity=${minSeverity}`, () => {
        const filtered = filterAlertsBySeverity(SAMPLE_ALERTS, minSeverity);
        expect(filtered.map((alert) => alert.severity)).toEqual(expected);
      });
    });

    it("returns an empty list when nothing meets the threshold", () => {
      const mediumOnly: SecurityAlert[] = [
        {
          id: "medium-only",
          source: "sensor",
          message: "only medium alerts",
          severity: "medium",
          timestamp: FIXED_TIMESTAMP,
        },
      ];

      const filtered = filterAlertsBySeverity(mediumOnly, "critical");
      expect(filtered).toHaveLength(0);
    });

    it("throws if minSeverity is unknown", () => {
      expect(() =>
        filterAlertsBySeverity(SAMPLE_ALERTS, "urgent" as Severity),
      ).toThrowError(/unknown severity/i);
    });

    it("throws if an alert contains an unknown severity", () => {
      const invalidAlerts: SecurityAlert[] = [
        ...SAMPLE_ALERTS,
        {
          ...SAMPLE_ALERTS[0],
          id: "bad-severity",
          severity: "invalid" as Severity,
        },
      ];

      expect(() => filterAlertsBySeverity(invalidAlerts, "low")).toThrowError(
        /unknown severity/i,
      );
    });
  });
});
