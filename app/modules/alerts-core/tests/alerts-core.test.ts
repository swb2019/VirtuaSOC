import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createAlert,
  filterAlertsBySeverity,
  Severity,
  SecurityAlert,
} from "../src";

function buildAlert(id: string, severity: Severity): SecurityAlert {
  return {
    id,
    source: `source-${id}`,
    message: `${severity} alert`,
    severity,
    timestamp: "2025-01-01T00:00:00.000Z",
  };
}

function buildSampleAlerts(): SecurityAlert[] {
  return [
    buildAlert("low-1", "low"),
    buildAlert("critical-1", "critical"),
    buildAlert("medium-1", "medium"),
    buildAlert("high-1", "high"),
    buildAlert("low-2", "low"),
    buildAlert("critical-2", "critical"),
    buildAlert("medium-2", "medium"),
  ];
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

  it("uses generated timestamp when timestamp input is whitespace", () => {
    const fixedDate = new Date("2025-01-02T03:04:05.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    const alert = createAlert({
      source: "soar",
      message: "Whitespace timestamp",
      severity: "medium",
      timestamp: "   ",
    });

    expect(alert.timestamp).toBe(fixedDate.toISOString());
  });

  const severityCases: Array<[Severity, string[]]> = [
    [
      "low",
      [
        "low-1",
        "critical-1",
        "medium-1",
        "high-1",
        "low-2",
        "critical-2",
        "medium-2",
      ],
    ],
    [
      "medium",
      ["critical-1", "medium-1", "high-1", "critical-2", "medium-2"],
    ],
    ["high", ["critical-1", "high-1", "critical-2"]],
    ["critical", ["critical-1", "critical-2"]],
  ];

  it.each(severityCases)(
    "filters alerts at %s threshold",
    (minSeverity, expectedIds) => {
      const alerts = buildSampleAlerts();
      const filtered = filterAlertsBySeverity(alerts, minSeverity);
      expect(filtered.map((a) => a.id)).toEqual(expectedIds);
      expect(alerts.map((a) => a.id)).toEqual([
        "low-1",
        "critical-1",
        "medium-1",
        "high-1",
        "low-2",
        "critical-2",
        "medium-2",
      ]);
    },
  );

  it("preserves alert ordering even when severities are unsorted", () => {
    const alerts: SecurityAlert[] = [
      buildAlert("first-critical", "critical"),
      buildAlert("second-low", "low"),
      buildAlert("third-high", "high"),
      buildAlert("fourth-medium", "medium"),
    ];

    const filtered = filterAlertsBySeverity(alerts, "medium");

    expect(filtered.map((a) => a.id)).toEqual([
      "first-critical",
      "third-high",
      "fourth-medium",
    ]);
    expect(filtered).not.toBe(alerts);
  });
});
