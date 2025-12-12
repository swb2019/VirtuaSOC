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

  it("retains provided alert id when supplied", () => {
    const alert = createAlert({
      id: " alert-123 ",
      source: "fusion",
      message: "Operator created alert",
      severity: "medium",
    });

    expect(alert.id).toBe("alert-123");
  });

  describe("filterAlertsBySeverity", () => {
    const alerts: SecurityAlert[] = [
      createAlert({
        source: "siem",
        message: "Informational",
        severity: "low",
      }),
      createAlert({
        source: "siem",
        message: "Warning",
        severity: "medium",
      }),
      createAlert({
        source: "siem",
        message: "Escalation",
        severity: "high",
      }),
      createAlert({
        source: "siem",
        message: "Critical issue",
        severity: "critical",
      }),
    ];

    const cases: { min: Severity; expected: Severity[] }[] = [
      { min: "low", expected: ["low", "medium", "high", "critical"] },
      { min: "medium", expected: ["medium", "high", "critical"] },
      { min: "high", expected: ["high", "critical"] },
      { min: "critical", expected: ["critical"] },
    ];

    cases.forEach(({ min, expected }) => {
      it(`returns alerts with severity >= ${min}`, () => {
        const filtered = filterAlertsBySeverity(alerts, min);
        expect(filtered.map((a) => a.severity)).toEqual(expected);
      });
    });

    it("preserves original order", () => {
      const filtered = filterAlertsBySeverity(alerts, "medium");
      expect(filtered.map((a) => a.message)).toEqual([
        "Warning",
        "Escalation",
        "Critical issue",
      ]);
    });
  });
});
