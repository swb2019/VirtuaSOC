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
    "replaces blank timestamp input (%s) with current time",
    (ts) => {
      vi.useFakeTimers();
      const fixedDate = new Date("2025-01-02T03:04:05.000Z");
      vi.setSystemTime(fixedDate);

      try {
        const alert = createAlert({
          source: "siem",
          message: "Blank timestamp",
          severity: "medium",
          timestamp: ts,
        });
        expect(alert.timestamp).toBe(fixedDate.toISOString());
      } finally {
        vi.useRealTimers();
      }
    },
  );
});

describe("filterAlertsBySeverity", () => {
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
      message: "High alert",
      severity: "high",
    }),
    createAlert({
      source: "siem",
      message: "Critical issue",
      severity: "critical",
    }),
  ];

  it("preserves alert order after filtering", () => {
    const filtered = filterAlertsBySeverity(alerts, "medium");
    expect(filtered.map((a) => a.message)).toEqual([
      "Warning",
      "High alert",
      "Critical issue",
    ]);
  });

  it.each([
    ["low", ["Info", "Warning", "High alert", "Critical issue"]],
    ["medium", ["Warning", "High alert", "Critical issue"]],
    ["high", ["High alert", "Critical issue"]],
    ["critical", ["Critical issue"]],
  ] satisfies [Severity, string[]][])(
    "filters alerts with minimum severity %s",
    (threshold, expectedMessages) => {
      const filtered = filterAlertsBySeverity(alerts, threshold);
      expect(filtered.map((a) => a.message)).toEqual(expectedMessages);
      expect(
        filtered.every(
          (a) =>
            indexOfSeverity(a.severity) >= indexOfSeverity(threshold),
        ),
      ).toBe(true);
    },
  );
});
