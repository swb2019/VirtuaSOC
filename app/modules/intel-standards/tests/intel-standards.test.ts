import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_MEANINGS,
  isSourceReliability,
  CONFIDENCE_LEVELS,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  isActionItemOverdue,
} from "../src";

describe("intel-standards: source reliability", () => {
  it("lists all six AF reliability codes with explanations", () => {
    expect(Object.keys(SOURCE_RELIABILITY_MEANINGS)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ]);
    expect(SOURCE_RELIABILITY_MEANINGS.A).toMatch(/reliable/i);
    expect(SOURCE_RELIABILITY_MEANINGS.F).toMatch(/cannot be judged/i);
  });

  it("type-guards acceptable reliability codes", () => {
    expect(isSourceReliability("A")).toBe(true);
    expect(isSourceReliability("G")).toBe(false);
    expect(isSourceReliability("")).toBe(false);
  });
});

describe("intel-standards: confidence + risk", () => {
  it("exposes ordered confidence levels", () => {
    expect(CONFIDENCE_LEVELS).toEqual(["high", "moderate", "low"]);
    const unique = new Set(CONFIDENCE_LEVELS);
    expect(unique.size).toBe(CONFIDENCE_LEVELS.length);
  });

  it("calculates risk scores with severity bands", () => {
    const assessment = calculateRiskScore(5, 4);
    expect(assessment.score).toBe(20);
    expect(assessment.level).toBe("critical");

    const moderate = calculateRiskScore(2, 3);
    expect(moderate.score).toBe(6);
    expect(moderate.level).toBe("low");
  });

  it("rejects invalid likelihood or impact values", () => {
    expect(() => calculateRiskScore(0 as 1, 3)).toThrow(/likelihood/i);
    expect(() => calculateRiskScore(2, 7 as 5)).toThrow(/impact/i);
  });

  it("builds a 5x5 matrix covering every pair", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row, rowIdx) => {
      expect(row).toHaveLength(5);
      row.forEach((cell, colIdx) => {
        expect(cell.likelihood).toBe(rowIdx + 1);
        expect(cell.impact).toBe(colIdx + 1);
        expect(cell.score).toBe(cell.likelihood * cell.impact);
      });
    });
  });
});

describe("intel-standards: action items", () => {
  it("creates action items with trimmed fields and ISO deadlines", () => {
    const item = createActionItem({
      action: "  Update DIS template ",
      owner: "  SOC Lead ",
      deadline: "2025-01-01",
    });

    expect(item.action).toBe("Update DIS template");
    expect(item.owner).toBe("SOC Lead");
    expect(item.deadline).toMatch(/T00:00:00\.000Z$/);
  });

  it("accepts Date deadlines and detects overdue items", () => {
    const deadline = new Date("2025-03-10T12:00:00.000Z");
    const item = createActionItem({
      action: "Rotate credentials",
      owner: "CISO",
      deadline,
    });

    const past = new Date("2025-04-01T00:00:00.000Z");
    const future = new Date("2025-03-01T00:00:00.000Z");

    expect(isActionItemOverdue(item, past)).toBe(true);
    expect(isActionItemOverdue(item, future)).toBe(false);
  });

  it("throws for missing owner/action/deadline", () => {
    expect(() =>
      createActionItem({
        action: "",
        owner: "Lead",
        deadline: "2025-01-01",
      }),
    ).toThrow(/Action description/);

    expect(() =>
      createActionItem({
        action: "Do thing",
        owner: " ",
        deadline: "2025-01-01",
      }),
    ).toThrow(/Action owner/);

    expect(() =>
      createActionItem({
        action: "Do thing",
        owner: "Lead",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/i);
  });
});
