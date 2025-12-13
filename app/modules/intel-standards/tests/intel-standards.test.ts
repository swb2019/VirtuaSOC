import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_SCALE,
  getSourceReliabilityDescriptor,
  getConfidenceDescriptor,
  evaluateRisk,
  createRiskMatrix,
  DEFAULT_RISK_THRESHOLDS,
  createActionItem,
  isActionItemOverdue,
} from "../src";

describe("intel-standards", () => {
  it("exposes AF-compliant source reliability descriptors", () => {
    const descriptor = getSourceReliabilityDescriptor("A");
    expect(descriptor.label).toMatch(/reliable/i);
    expect(SOURCE_RELIABILITY_SCALE.F.code).toBe("F");
  });

  it("maps analytic confidence levels to descriptions", () => {
    expect(getConfidenceDescriptor("moderate").description).toMatch(
      /incomplete/i,
    );
    expect(CONFIDENCE_SCALE.low.level).toBe("low");
  });

  it("evaluates risk score and rating using default thresholds", () => {
    const cell = evaluateRisk(5, 5);
    expect(cell.score).toBe(25);
    expect(cell.rating).toBe("critical");

    const lowerCell = evaluateRisk(1, 2);
    expect(lowerCell.score).toBe(2);
    expect(lowerCell.rating).toBe("low");
  });

  it("supports custom risk thresholds", () => {
    const custom = { lowMax: 2, moderateMax: 6, highMax: 10 } as const;
    const moderate = evaluateRisk(2, 2, custom);
    expect(moderate.rating).toBe("moderate");

    const critical = evaluateRisk(5, 3, custom);
    expect(critical.rating).toBe("critical");
  });

  it("builds a deterministic 5x5 risk matrix", () => {
    const matrix = createRiskMatrix();
    expect(matrix).toHaveLength(5);
    expect(matrix.every((row) => row.length === 5)).toBe(true);
    expect(matrix[0][0].score).toBe(1);
    expect(matrix[4][4].score).toBe(25);
  });

  it("rejects invalid threshold overrides", () => {
    expect(() =>
      evaluateRisk(1, 1, { ...DEFAULT_RISK_THRESHOLDS, highMax: 30 }),
    ).toThrow(/1-25/i);

    expect(() =>
      evaluateRisk(1, 1, { lowMax: 5, moderateMax: 4, highMax: 10 }),
    ).toThrow(/increasing/i);
  });

  it("creates action items with normalized data", () => {
    const action = createActionItem({
      title: "  Patch VPN gateway  ",
      owner: " soc-team ",
      deadline: "2025-01-01T00:00:00Z",
    });

    expect(action.title).toBe("Patch VPN gateway");
    expect(action.owner).toBe("soc-team");
    expect(action.deadline).toBe("2025-01-01T00:00:00.000Z");
    expect(action.status).toBe("pending");
  });

  it("detects overdue action items relative to a reference date", () => {
    const action = createActionItem({
      title: "Ship situational report",
      owner: "intel-lead",
      deadline: "2024-01-01T00:00:00Z",
    });

    expect(
      isActionItemOverdue(action, new Date("2024-02-01T00:00:00Z")),
    ).toBe(true);
    expect(
      isActionItemOverdue(action, new Date("2023-12-31T00:00:00Z")),
    ).toBe(false);
  });
});
