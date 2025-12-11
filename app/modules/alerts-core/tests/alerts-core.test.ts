import { describe, it, expect, vi } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

function withFixedTime<T>(isoTimestamp: string, fn: () => T): T {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoTimestamp));
  try {
    return fn();
  } finally {
    vi.useRealTimers();
  }
}

describe("createAlert", () => {
  it("generates an ISO timestamp when not provided", () => {
    const fixedTime = "2025-01-01T12:00:00.000Z";
    const alert = withFixedTime(fixedTime, () =>
      createAlert({
        source: "eds",
        message: "Suspicious login",
        severity: "high",
      }),
    );

    expect(alert.id).toBeTypeOf("string");
    expect(alert.id.length).toBeGreaterThan(0);
    expect(alert.source).toBe("eds");
    expect(alert.message).toBe("Suspicious login");
    expect(alert.severity).toBe("high");
    expect(alert.timestamp).toBe(fixedTime);
  });

  it("fallbacks to generated timestamp when provided timestamp is blank", () => {
    const fixedTime = "2025-01-02T00:00:00.000Z";
    const alert = withFixedTime(fixedTime, () =>
      createAlert({
        source: "eds",
        message: "Whitespace timestamp",
        severity: "medium",
        timestamp: "   ",
      }),
    );

    expect(alert.timestamp).toBe(fixedTime);
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
});

describe("filterAlertsBySeverity", () => {
  function buildAlert(severity: Severity, message: string): SecurityAlert {
    return createAlert({
      source: "siem",
      message,
      severity,
    });
  }

  const orderedAlerts: SecurityAlert[] = [
    buildAlert("low", "Informational"),
    buildAlert("medium", "Warning"),
    buildAlert("high", "Escalation"),
    buildAlert("critical", "Critical issue"),
  ];

  (
    [
      ["low", ["low", "medium", "high", "critical"]],
      ["medium", ["medium", "high", "critical"]],
      ["high", ["high", "critical"]],
      ["critical", ["critical"]],
    ] as [Severity, Severity[]][]
  ).forEach(([threshold, expectedSeverities]) => {
    it(`returns alerts at ${threshold} or above`, () => {
      const filtered = filterAlertsBySeverity(orderedAlerts, threshold);
      expect(filtered.map((a) => a.severity)).toEqual(expectedSeverities);
    });
  });

  it("preserves the original order", () => {
    const shuffledAlerts: SecurityAlert[] = [
      buildAlert("medium", "warning-b"),
      buildAlert("critical", "critical-a"),
      buildAlert("low", "info-a"),
      buildAlert("high", "high-a"),
    ];

    const filtered = filterAlertsBySeverity(shuffledAlerts, "low");
    expect(filtered.map((a) => a.message)).toEqual([
      "warning-b",
      "critical-a",
      "info-a",
      "high-a",
    ]);
  });
});
