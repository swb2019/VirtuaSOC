import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_LEVELS,
  describeSourceReliability,
  compareConfidence,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  isActionItemOverdue,
} from "../src";

describe("intel-standards", () => {
  it("maps every source reliability code to a description", () => {
    SOURCE_RELIABILITY_LEVELS.forEach((level) => {
      expect(describeSourceReliability(level)).toMatch(/reliable|judged/i);
    });
  });

  it("orders confidence levels from high to low", () => {
    expect(compareConfidence("high", "low")).toBe(1);
    expect(compareConfidence("moderate", "moderate")).toBe(0);
    expect(compareConfidence("low", "high")).toBe(-1);
  });

  it("calculates risk scores with deterministic bands", () => {
    expect(calculateRiskScore(5, 5)).toEqual({ value: 25, band: "critical" });
    expect(calculateRiskScore(2, 2)).toEqual({ value: 4, band: "minimal" });
    expect(() => calculateRiskScore(6 as 5, 1)).toThrow(/likelihood/i);
  });

  it("builds a 5x5 risk matrix that matches calculateRiskScore", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const cell = matrix[4][4];
    expect(cell.likelihood).toBe(5);
    expect(cell.impact).toBe(5);
    expect(cell.score).toEqual(calculateRiskScore(5, 5));
  });

  it("creates action items with normalized inputs and overdue calculations", () => {
    const action = createActionItem({
      description: "Publish DIS",
      owner: "  Intel Lead  ",
      deadline: "2025-01-01T00:00:00.000Z",
    });

    expect(action.owner).toBe("Intel Lead");
    expect(action.description).toBe("Publish DIS");
    expect(action.completed).toBe(false);

    const overdue = isActionItemOverdue(action, new Date("2025-02-01T00:00:00Z"));
    expect(overdue).toBe(true);
  });

  it("rejects action items missing owner or invalid deadlines", () => {
    expect(() =>
      createActionItem({
        description: "",
        owner: "Analyst",
        deadline: new Date(),
      }),
    ).toThrow(/description/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: " ",
        deadline: new Date(),
      }),
    ).toThrow(/owner/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "Analyst",
        deadline: "invalid-date",
      }),
    ).toThrow(/deadline/);
  });
});
