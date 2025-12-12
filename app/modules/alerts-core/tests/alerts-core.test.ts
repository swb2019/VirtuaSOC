import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];
const FIXED_TIME = "2025-01-01T10:00:00.000Z";

function indexOfSeverity(s: Severity): number {
  return SEVERITY_ORDER.indexOf(s);
}

describe("alerts-core", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_TIME));
  });

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
    expect(alert.timestamp).toBe(FIXED_TIME);
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

  it("normalizes valid timestamps with extra whitespace", () => {
    const alert = createAlert({
      source: "siem",
      message: "Normalized alert",
      severity: "medium",
      timestamp: " 2025-12-24T12:34:56Z ",
    });

    expect(alert.timestamp).toBe("2025-12-24T12:34:56.000Z");
  });

  it("falls back to generated timestamp when provided timestamp is invalid", () => {
    const alert = createAlert({
      source: "siem",
      message: "Bad timestamp",
      severity: "low",
      timestamp: "not-a-real-timestamp",
    });

    expect(alert.timestamp).toBe(FIXED_TIME);
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
