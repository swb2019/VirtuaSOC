import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_LEVELS,
  createRiskMatrix,
  calculateRiskScore,
  classifyRisk,
  createActionItem,
  RiskMatrix,
  Likelihood,
} from "../src";

describe("intel-standards primitives", () => {
  it("exposes the full source reliability scale", () => {
    const codes = Object.keys(SOURCE_RELIABILITY_SCALE);
    expect(codes).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(SOURCE_RELIABILITY_SCALE.A.title).toContain("Completely reliable");
  });

  it("provides descriptions for each confidence level", () => {
    expect(Object.keys(CONFIDENCE_LEVELS)).toEqual([
      "high",
      "moderate",
      "low",
    ]);
    expect(CONFIDENCE_LEVELS.moderate.description.length).toBeGreaterThan(10);
  });

  it("builds a 5x5 risk matrix with ratings", () => {
    const matrix: RiskMatrix = createRiskMatrix();
    expect(matrix.cells).toHaveLength(25);

    const highestCell = matrix.cells.find(
      (cell) => cell.likelihood === 5 && cell.impact === 5,
    );
    expect(highestCell?.score).toBe(25);
    expect(highestCell?.rating).toBe("critical");
  });

  it("calculates and classifies risk scores with validation", () => {
    const score = calculateRiskScore(3, 4);
    expect(score).toBe(12);
    expect(classifyRisk(score)).toBe("moderate");

    expect(() =>
      calculateRiskScore(0 as unknown as Likelihood, 1),
    ).toThrowError(/likelihood/);
  });

  it("creates action items with normalized values", () => {
    const deadline = new Date("2025-12-01T00:00:00Z");
    const item = createActionItem({
      summary: "  Coordinate flash alert draft  ",
      owner: "  intel lead  ",
      deadline,
    });

    expect(item.summary).toBe("Coordinate flash alert draft");
    expect(item.owner).toBe("intel lead");
    expect(item.deadline).toBe(deadline.toISOString());

    expect(() =>
      createActionItem({
        summary: "",
        owner: "ops",
        deadline: deadline.toISOString(),
      }),
    ).toThrowError(/summary/);
  });
});
