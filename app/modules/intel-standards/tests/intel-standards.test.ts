import { describe, it, expect } from "vitest";
import {
  ensureSourceReliability,
  ensureConfidenceLevel,
  ensureLikelihood,
  ensureImpact,
  calculateRiskScore,
  createRiskMatrixCell,
  buildRiskMatrix,
  createActionItem,
  ActionItem,
} from "../src";

describe("intel-standards", () => {
  it("parses source reliability in a case-insensitive manner", () => {
    expect(ensureSourceReliability("a")).toBe("A");
    expect(ensureSourceReliability("F")).toBe("F");
    expect(() => ensureSourceReliability("G")).toThrow(/Invalid source reliability/);
  });

  it("parses confidence levels and rejects invalid input", () => {
    expect(ensureConfidenceLevel("High")).toBe("high");
    expect(ensureConfidenceLevel("moderate")).toBe("moderate");
    expect(() => ensureConfidenceLevel("Unknown")).toThrow(/Invalid confidence level/);
  });

  it("validates likelihood and impact helpers", () => {
    expect(ensureLikelihood(5)).toBe(5);
    expect(ensureImpact(1)).toBe(1);
    expect(() => ensureLikelihood(0)).toThrow(/likelihood/);
    expect(() => ensureImpact(6)).toThrow(/impact/);
  });

  it("calculates risk scores", () => {
    const likelihood = ensureLikelihood(4);
    const impact = ensureImpact(5);
    expect(calculateRiskScore(likelihood, impact)).toBe(20);
  });

  it("creates risk matrix cells with derived scores", () => {
    const cell = createRiskMatrixCell(ensureLikelihood(3), ensureImpact(2));
    expect(cell).toEqual({ likelihood: 3, impact: 2, score: 6 });
  });

  it("builds a 5x5 risk matrix ordered by likelihood rows", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row, rowIndex) => {
      expect(row).toHaveLength(5);
      row.forEach((cell, colIndex) => {
        expect(cell.likelihood).toBe(rowIndex + 1);
        expect(cell.impact).toBe(colIndex + 1);
        expect(cell.score).toBe((rowIndex + 1) * (colIndex + 1));
      });
    });
  });

  it("creates action items with trimmed data, ISO deadlines, and default status", () => {
    const item: ActionItem = createActionItem({
      description: "  Mitigate phishing infrastructure  ",
      owner: " Shift Lead  ",
      deadline: "2025-12-01T00:00:00Z",
    });
    expect(item.description).toBe("Mitigate phishing infrastructure");
    expect(item.owner).toBe("Shift Lead");
    expect(item.status).toBe("pending");
    expect(item.deadline).toBe("2025-12-01T00:00:00.000Z");
  });

  it("rejects action items with invalid data", () => {
    expect(() =>
      createActionItem({ description: "", owner: "SecOps", deadline: "2025-01-01" }),
    ).toThrow(/description/);
    expect(() =>
      createActionItem({
        description: "Patch firmware",
        owner: "",
        deadline: "2025-01-01",
      }),
    ).toThrow(/owner/);
    expect(() =>
      createActionItem({
        description: "Patch firmware",
        owner: "Lead",
        deadline: "not-a-date",
      }),
    ).toThrow(/Invalid deadline/);
  });
});
