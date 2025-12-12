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

describe("alerts-core", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("normalizes parseable timestamps to ISO 8601", () => {
    const alert = createAlert({
      source: "siem",
      message: "Offset timestamp",
      severity: "medium",
      timestamp: "2025-12-12T10:00:00-05:00",
    });

    expect(alert.timestamp).toBe("2025-12-12T15:00:00.000Z");
  });

  it("falls back to generated timestamp when timestamp is blank", () => {
    const fixedNow = new Date("2025-12-12T10:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const alert = createAlert({
      source: "feed",
      message: "missing timestamp",
      severity: "low",
      timestamp: "   ",
    });

    expect(alert.timestamp).toBe(fixedNow.toISOString());
  });

  it("falls back to generated timestamp when timestamp is invalid", () => {
    const fixedNow = new Date("2025-12-13T03:21:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const alert = createAlert({
      source: "feed",
      message: "bad timestamp",
      severity: "low",
      // Intentionally invalid.
      timestamp: "not-a-date",
    });

    expect(alert.timestamp).toBe(fixedNow.toISOString());
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
});
