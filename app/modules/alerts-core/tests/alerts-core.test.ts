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

function createSampleAlert(
  message: string,
  severity: Severity,
): SecurityAlert {
  return createAlert({
    source: "siem",
    message,
    severity,
    timestamp: `2025-01-01T00:00:0${indexOfSeverity(severity)}.000Z`,
  });
}

afterEach(() => {
  vi.useRealTimers();
});

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

  it("generates timestamp when provided value is blank", () => {
    const fixedDate = new Date("2025-12-01T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    const alert = createAlert({
      source: "eds",
      message: "Empty timestamp",
      severity: "medium",
      timestamp: "   ",
    });

    expect(alert.timestamp).toBe(fixedDate.toISOString());
  });

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
        (a) => indexOfSeverity(a.severity) >= indexOfSeverity("high"),
      ),
    ).toBe(true);
  });

  it("preserves alert order after filtering", () => {
    const alerts: SecurityAlert[] = [
      createSampleAlert("Critical", "critical"),
      createSampleAlert("Low", "low"),
      createSampleAlert("High", "high"),
      createSampleAlert("Medium", "medium"),
    ];

    const filtered = filterAlertsBySeverity(alerts, "medium");
    expect(filtered.map((a) => a.message)).toEqual([
      "Critical",
      "High",
      "Medium",
    ]);
  });

  const severityCases: { min: Severity; expected: Severity[] }[] = [
    { min: "low", expected: ["low", "medium", "high", "critical"] },
    { min: "medium", expected: ["medium", "high", "critical"] },
    { min: "high", expected: ["high", "critical"] },
    { min: "critical", expected: ["critical"] },
  ];

  severityCases.forEach(({ min, expected }) => {
    it(`filters correctly when minimum severity is ${min}`, () => {
      const alerts = SEVERITY_ORDER.map((severity) =>
        createSampleAlert(`${severity} alert`, severity),
      );

      const filtered = filterAlertsBySeverity(alerts, min);
      expect(filtered.map((a) => a.severity)).toEqual(expected);
    });
  });
});
