import { describe, expect, it } from "vitest";
import {
  ActionItem,
  ConfidenceLevel,
  CONFIDENCE_SCALE,
  createActionItem,
  deriveRiskScore,
  getConfidenceDescriptor,
  getSourceReliability,
  RISK_MATRIX,
  SOURCE_RELIABILITY_SCALE,
  SourceReliabilityGrade,
} from "../src";

describe("intel-standards primitives", () => {
  it("exposes AF source reliability scale with narratives", () => {
    const grades: SourceReliabilityGrade[] = ["A", "B", "C", "D", "E", "F"];
    grades.forEach((grade) => {
      const descriptor = getSourceReliability(grade);
      expect(descriptor.grade).toBe(grade);
      expect(descriptor.meaning.length).toBeGreaterThan(10);
    });
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toEqual(grades);
  });

  it("exposes analytic confidence levels", () => {
    const levels: ConfidenceLevel[] = ["high", "moderate", "low"];
    levels.forEach((level) => {
      const descriptor = getConfidenceDescriptor(level);
      expect(descriptor.level).toBe(level);
      expect(descriptor.meaning.length).toBeGreaterThan(10);
    });
    expect(Object.keys(CONFIDENCE_SCALE)).toEqual(levels);
  });

  it("derives risk scores and qualitative categories", () => {
    const score = deriveRiskScore(5, 4);
    expect(score.score).toBe(20);
    expect(score.category).toBe("critical");

    const moderateScore = deriveRiskScore(3, 3);
    expect(moderateScore.score).toBe(9);
    expect(moderateScore.category).toBe("moderate");
  });

  it("rejects likelihood/impact outside 1-5", () => {
    expect(() => deriveRiskScore(0 as never, 3)).toThrow(/likelihood/);
    expect(() => deriveRiskScore(3, 8 as never)).toThrow(/impact/);
  });

  it("builds a canonical 5x5 risk matrix", () => {
    expect(RISK_MATRIX).toHaveLength(5);
    RISK_MATRIX.forEach((row) => expect(row).toHaveLength(5));
    const bottomRight = RISK_MATRIX[4][4];
    expect(bottomRight.score).toBe(25);
    expect(bottomRight.category).toBe("critical");

    // Matrix entries must equal direct derivation.
    RISK_MATRIX.forEach((row, likelihoodIdx) => {
      row.forEach((cell, impactIdx) => {
        const expected = deriveRiskScore(
          (likelihoodIdx + 1) as 1 | 2 | 3 | 4 | 5,
          (impactIdx + 1) as 1 | 2 | 3 | 4 | 5,
        );
        expect(cell).toEqual(expected);
      });
    });
  });

  it("creates action items with normalized fields", () => {
    const item: ActionItem = createActionItem({
      action: "  Close incident report ",
      owner: "  SOC Lead ",
      deadline: "2025-01-15",
    });

    expect(item).toMatchObject({
      action: "Close incident report",
      owner: "SOC Lead",
      status: "planned",
    });
    expect(item.deadline).toBe("2025-01-15T00:00:00.000Z");
  });

  it("requires valid deadlines", () => {
    expect(() =>
      createActionItem({
        action: "Notify stakeholders",
        owner: "Intel lead",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/);
  });
});
