import { describe, it, expect } from "vitest";
import {
  sourceReliabilityScale,
  confidenceScale,
  calculateRiskScore,
  riskMatrix,
  createActionItem,
  isActionItemDueSoon,
  ActionItem,
} from "../src";

describe("intel-standards primitives", () => {
  it("exposes AF source reliability grades in order", () => {
    const grades = sourceReliabilityScale.map((entry) => entry.grade);
    expect(grades).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(
      sourceReliabilityScale.every(
        (entry) => typeof entry.description === "string" && entry.description.length > 0,
      ),
    ).toBe(true);
  });

  it("lists confidence levels with descriptions", () => {
    const levels = confidenceScale.map((entry) => entry.level);
    expect(levels).toEqual(["high", "moderate", "low"]);
    expect(
      confidenceScale.every(
        (entry) => typeof entry.description === "string" && entry.description.length > 0,
      ),
    ).toBe(true);
  });

  it("calculates risk scores and categories", () => {
    const highScore = calculateRiskScore(5, 4);
    expect(highScore).toMatchObject({
      likelihood: 5,
      impact: 4,
      score: 20,
      category: "critical",
    });

    const moderateScore = calculateRiskScore(3, 3);
    expect(moderateScore).toMatchObject({
      score: 9,
      category: "moderate",
    });

    expect(() => calculateRiskScore(0 as 1, 3)).toThrowError();
    expect(() => calculateRiskScore(3, 6 as 5)).toThrowError();
  });

  it("generates a 5x5 risk matrix aligned with calculateRiskScore", () => {
    expect(riskMatrix).toHaveLength(5);
    riskMatrix.forEach((row, rowIdx) => {
      expect(row).toHaveLength(5);
      row.forEach((cell, colIdx) => {
        const likelihood = (rowIdx + 1) as 1 | 2 | 3 | 4 | 5;
        const impact = (colIdx + 1) as 1 | 2 | 3 | 4 | 5;
        expect(cell).toEqual(calculateRiskScore(likelihood, impact));
      });
    });
  });

  it("creates normalized action items and rejects invalid data", () => {
    const deadline = new Date("2025-12-01T00:00:00.000Z");
    const action = createActionItem({
      owner: "  Ops Lead ",
      description: " Deliver DIS ",
      deadline,
    });

    expect(action.owner).toBe("Ops Lead");
    expect(action.description).toBe("Deliver DIS");
    expect(action.deadline).toBe(deadline.toISOString());

    expect(() =>
      createActionItem({
        owner: "",
        description: "Missing owner",
        deadline: deadline.toISOString(),
      }),
    ).toThrowError();

    expect(() =>
      createActionItem({
        owner: "Owner",
        description: "Bad deadline",
        deadline: "not-a-date",
      }),
    ).toThrowError();
  });

  it("evaluates action item urgency with optional reference date", () => {
    const reference = new Date("2025-01-01T00:00:00.000Z");
    const soonItem: ActionItem = {
      owner: "Intel",
      description: "Send flash alert",
      deadline: "2025-01-02T00:00:00.000Z",
    };
    const farItem: ActionItem = {
      owner: "Intel",
      description: "Monthly review",
      deadline: "2025-02-01T00:00:00.000Z",
    };

    expect(isActionItemDueSoon(soonItem, 2, reference)).toBe(true);
    expect(isActionItemDueSoon(farItem, 2, reference)).toBe(false);

    const pastItem: ActionItem = {
      owner: "Intel",
      description: "Overdue action",
      deadline: "2024-12-01T00:00:00.000Z",
    };
    expect(isActionItemDueSoon(pastItem, 2, reference)).toBe(true);
    expect(() => isActionItemDueSoon(soonItem, -1, reference)).toThrowError();
  });
});
