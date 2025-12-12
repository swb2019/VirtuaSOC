import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_DESCRIPTIONS,
  CONFIDENCE_LEVEL_DESCRIPTIONS,
  describeSourceReliability,
  describeConfidence,
  generateRiskMatrix,
  evaluateRisk,
  createActionItem,
  isActionItemOverdue,
  RiskScore,
  ActionItem,
} from "../src";

describe("intel-standards", () => {
  it("provides descriptions for every source reliability tier", () => {
    Object.entries(SOURCE_RELIABILITY_DESCRIPTIONS).forEach(([tier, desc]) => {
      expect(desc.length).toBeGreaterThan(0);
      expect(describeSourceReliability(tier as keyof typeof SOURCE_RELIABILITY_DESCRIPTIONS)).toBe(desc);
    });
  });

  it("provides descriptions for every confidence level", () => {
    Object.entries(CONFIDENCE_LEVEL_DESCRIPTIONS).forEach(([level, desc]) => {
      expect(desc.length).toBeGreaterThan(0);
      expect(
        describeConfidence(level as keyof typeof CONFIDENCE_LEVEL_DESCRIPTIONS),
      ).toBe(desc);
    });
  });

  it("generates a complete 5x5 risk matrix", () => {
    const matrix = generateRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row, rowIdx) => {
      expect(row).toHaveLength(5);
      row.forEach((cell, colIdx) => {
        const expected: RiskScore = evaluateRisk(
          (rowIdx + 1) as 1,
          (colIdx + 1) as 1,
        );
        expect(cell).toEqual(expected);
      });
    });
  });

  it("derives ratings from risk scores", () => {
    expect(evaluateRisk(1, 5).rating).toBe("low");
    expect(evaluateRisk(3, 4).rating).toBe("moderate");
    expect(evaluateRisk(4, 4).rating).toBe("high");
    expect(evaluateRisk(5, 5).rating).toBe("critical");
  });

  it("throws when likelihood or impact are out of range", () => {
    expect(() => evaluateRisk(6 as 1, 1)).toThrow(/likelihood/i);
    expect(() => evaluateRisk(1, 0 as 1)).toThrow(/impact/i);
  });

  it("creates normalized action items and detects overdue state", () => {
    const item = createActionItem({
      description: "  Draft flash alert  ",
      owner: "  Analyst A ",
      deadline: "2025-01-01T00:00:00.000Z",
    });

    expect(item.description).toBe("Draft flash alert");
    expect(item.owner).toBe("Analyst A");
    expect(item.status).toBe("pending");
    expect(item.deadline).toBe("2025-01-01T00:00:00.000Z");

    expect(
      isActionItemOverdue(item, "2025-02-01T00:00:00.000Z"),
    ).toBe(true);
  });

  it("considers completed items not overdue and validates reference dates", () => {
    const complete: ActionItem = {
      description: "Submit DIS",
      owner: "Analyst B",
      deadline: "2025-01-01T00:00:00.000Z",
      status: "complete",
    };
    expect(isActionItemOverdue(complete, "2025-02-01T00:00:00.000Z")).toBe(
      false,
    );

    expect(() =>
      isActionItemOverdue(complete, "not-a-date"),
    ).toThrow(/referenceDate/i);
  });

  it("validates deadlines when creating items", () => {
    expect(() =>
      createActionItem({
        description: "Task",
        owner: "Analyst",
        deadline: "bad-date",
      }),
    ).toThrow(/deadline must be a valid ISO 8601/i);
  });
});
