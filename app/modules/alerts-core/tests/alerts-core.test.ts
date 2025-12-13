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

function buildAlert(input: Partial<SecurityAlert> & { severity: Severity }) {
  return createAlert({
    source: input.source ?? "siem",
    message: input.message ?? input.severity,
    severity: input.severity,
    timestamp: input.timestamp,
  });
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

  it("normalizes blank timestamps to current time", () => {
    const fakeNow = new Date("2025-12-01T10:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fakeNow);

    const alert = createAlert({
      source: "siem",
      message: "Leading/trailing whitespace timestamp should be replaced",
      severity: "medium",
      timestamp: "   ",
    });

    expect(alert.timestamp).toBe(fakeNow.toISOString());

    vi.useRealTimers();
  });

  it("filters alerts by each severity threshold", () => {
    const alerts: SecurityAlert[] = [
      buildAlert({ severity: "low" }),
      buildAlert({ severity: "medium" }),
      buildAlert({ severity: "high" }),
      buildAlert({ severity: "critical" }),
    ];

    const cases: Array<{ threshold: Severity; expected: Severity[] }> = [
      { threshold: "low", expected: ["low", "medium", "high", "critical"] },
      { threshold: "medium", expected: ["medium", "high", "critical"] },
      { threshold: "high", expected: ["high", "critical"] },
      { threshold: "critical", expected: ["critical"] },
    ];

    cases.forEach(({ threshold, expected }) => {
      const filtered = filterAlertsBySeverity(alerts, threshold);
      expect(filtered.map((a) => a.severity)).toEqual(expected);
    });
  });

  it("preserves original ordering when filtering", () => {
    const alerts: SecurityAlert[] = [
      buildAlert({ severity: "high", message: "first" }),
      buildAlert({ severity: "low", message: "second" }),
      buildAlert({ severity: "critical", message: "third" }),
      buildAlert({ severity: "medium", message: "fourth" }),
    ];

    const filtered = filterAlertsBySeverity(alerts, "medium");
    expect(filtered.map((a) => a.message)).toEqual(["first", "third", "fourth"]);
  });
});
