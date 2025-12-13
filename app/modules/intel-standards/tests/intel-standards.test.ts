import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_DESCRIPTORS,
  CONFIDENCE_LEVEL_DESCRIPTORS,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  LikelihoodLevel,
} from "../src";

describe("intel-standards primitives", () => {
  it("exposes every source reliability and confidence descriptor", () => {
    expect(Object.keys(SOURCE_RELIABILITY_DESCRIPTORS)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ]);

    expect(Object.keys(CONFIDENCE_LEVEL_DESCRIPTORS)).toEqual([
      "high",
      "moderate",
      "low",
    ]);

    // spot-check descriptor text to guard against accidental edits
    expect(SOURCE_RELIABILITY_DESCRIPTORS.A).toContain("reliable");
    expect(CONFIDENCE_LEVEL_DESCRIPTORS.low).toContain("Low confidence");
  });

  it("calculates risk scores and qualitative ratings", () => {
    expect(calculateRiskScore(1, 5)).toMatchObject({
      score: 5,
      rating: "low",
    });

    expect(calculateRiskScore(3, 4)).toMatchObject({
      score: 12,
      rating: "moderate",
    });

    expect(calculateRiskScore(4, 4)).toMatchObject({
      score: 16,
      rating: "high",
    });

    expect(calculateRiskScore(5, 4)).toMatchObject({
      score: 20,
      rating: "critical",
    });
  });

  it("rejects out-of-range likelihood or impact values", () => {
    expect(() => calculateRiskScore(0 as LikelihoodLevel, 3)).toThrow();
    expect(() => calculateRiskScore(3, 6 as LikelihoodLevel)).toThrow();
  });

  it("builds a 5x5 risk matrix with monotonic scores", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const flatScores = matrix.flat().map((cell) => cell.score);
    expect(Math.min(...flatScores)).toBe(1);
    expect(Math.max(...flatScores)).toBe(25);

    matrix.forEach((row) => {
      for (let i = 1; i < row.length; i++) {
        expect(row[i].score).toBeGreaterThanOrEqual(row[i - 1].score);
      }
    });
  });

  it("normalizes action items and enforces validation", () => {
    const item = createActionItem({
      summary: "  Coordinate DIS outputs  ",
      owner: "  Dana Analyst ",
      deadline: "2025-12-15T00:00:00Z",
    });

    expect(item.summary).toBe("Coordinate DIS outputs");
    expect(item.owner).toBe("Dana Analyst");
    expect(item.deadline).toBe("2025-12-15T00:00:00.000Z");

    expect(() =>
      createActionItem({
        summary: "",
        owner: "Ops",
        deadline: "2025-01-01T00:00:00Z",
      }),
    ).toThrow();

    expect(() =>
      createActionItem({
        summary: "Escalate",
        owner: "",
        deadline: "2025-01-01T00:00:00Z",
      }),
    ).toThrow();

    expect(() =>
      createActionItem({
        summary: "Escalate",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow();
  });
});
