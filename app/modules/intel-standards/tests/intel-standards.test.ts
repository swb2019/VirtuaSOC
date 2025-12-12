import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  getSourceReliability,
  isValidSourceReliability,
  CONFIDENCE_SCALE,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  isActionItemOverdue,
} from "../src";

const ISO_DATE = "2025-01-15T12:00:00.000Z";

describe("intel-standards", () => {
  it("exposes all six source reliability codes", () => {
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toHaveLength(6);
    const descriptor = getSourceReliability("A");
    expect(descriptor.code).toBe("A");
    expect(descriptor.name.toLowerCase()).toContain("reliable");
    expect(isValidSourceReliability("B")).toBe(true);
    expect(isValidSourceReliability("Z")).toBe(false);
  });

  it("provides confidence metadata", () => {
    expect(CONFIDENCE_SCALE.high.description.length).toBeGreaterThan(10);
    expect(CONFIDENCE_SCALE.low.level).toBe("low");
  });

  it("calculates risk scores with correct categories", () => {
    expect(calculateRiskScore(2, 3)).toMatchObject({
      score: 6,
      category: "low",
    });
    expect(calculateRiskScore(3, 4)).toMatchObject({
      score: 12,
      category: "moderate",
    });
    expect(calculateRiskScore(4, 4)).toMatchObject({
      score: 16,
      category: "high",
    });
    expect(calculateRiskScore(5, 4)).toMatchObject({
      score: 20,
      category: "critical",
    });
  });

  it("builds a canonical 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));
    const cell = matrix[2][4]; // likelihood 3, impact 5
    expect(cell.likelihood).toBe(3);
    expect(cell.impact).toBe(5);
    expect(cell.score).toBe(15);
  });

  it("creates action items with validation and trimming", () => {
    const item = createActionItem({
      description: "  Draft DIS template  ",
      owner: "  analyst@virtua.soc  ",
      deadline: ISO_DATE,
    });
    expect(item.description).toBe("Draft DIS template");
    expect(item.owner).toBe("analyst@virtua.soc");
    expect(item.deadline).toBe(ISO_DATE);
  });

  it("rejects action items with bad deadlines", () => {
    expect(() =>
      createActionItem({
        description: "Missing deadline",
        owner: "ops",
        deadline: "2025-01-15",
      }),
    ).toThrowError();
  });

  it("detects overdue action items", () => {
    const item = createActionItem({
      description: "Publish bulletin",
      owner: "ops",
      deadline: "2025-01-01T00:00:00.000Z",
    });
    expect(
      isActionItemOverdue(item, "2025-01-02T00:00:00.000Z"),
    ).toBe(true);
    expect(
      isActionItemOverdue(item, "2024-12-31T23:59:59.000Z"),
    ).toBe(false);
  });
});
