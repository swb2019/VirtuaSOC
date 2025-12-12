import { describe, it, expect } from "vitest";
import {
  describeSourceReliability,
  describeConfidence,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  SourceReliabilityGrade,
  ConfidenceLevel,
  LikelihoodLevel,
  ImpactLevel,
} from "../src";

const RELIABILITY_GRADES: SourceReliabilityGrade[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  "high",
  "moderate",
  "low",
];

const SCALE_VALUES: LikelihoodLevel[] = [1, 2, 3, 4, 5];
const IMPACT_VALUES: ImpactLevel[] = [1, 2, 3, 4, 5];

describe("intel-standards", () => {
  it("describes every source reliability grade", () => {
    RELIABILITY_GRADES.forEach((grade) => {
      const descriptor = describeSourceReliability(grade);
      expect(descriptor.grade).toBe(grade);
      expect(descriptor.description.length).toBeGreaterThan(0);
    });

    expect(() =>
      describeSourceReliability("Z" as SourceReliabilityGrade),
    ).toThrowError();
  });

  it("describes confidence levels", () => {
    CONFIDENCE_LEVELS.forEach((level) => {
      const descriptor = describeConfidence(level);
      expect(descriptor.level).toBe(level);
      expect(descriptor.description.toLowerCase()).toContain(level);
    });
  });

  it("calculates risk scores and classifications", () => {
    const samples: Array<{
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      classification: ReturnType<typeof calculateRiskScore>["classification"];
    }> = [
      { likelihood: 1, impact: 4, classification: "low" },
      { likelihood: 2, impact: 5, classification: "guarded" },
      { likelihood: 3, impact: 5, classification: "moderate" },
      { likelihood: 4, impact: 5, classification: "high" },
      { likelihood: 5, impact: 5, classification: "critical" },
    ];

    samples.forEach((sample) => {
      const score = calculateRiskScore(sample.likelihood, sample.impact);
      expect(score.score).toBe(sample.likelihood * sample.impact);
      expect(score.classification).toBe(sample.classification);
    });
  });

  it("builds a 5x5 risk matrix populated with derived scores", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(SCALE_VALUES.length);

    matrix.forEach((row, rowIndex) => {
      expect(row).toHaveLength(IMPACT_VALUES.length);
      row.forEach((cell, columnIndex) => {
        const likelihood = SCALE_VALUES[rowIndex];
        const impact = IMPACT_VALUES[columnIndex];
        expect(cell.likelihood).toBe(likelihood);
        expect(cell.impact).toBe(impact);
        expect(cell.score).toBe(likelihood * impact);
      });
    });
  });

  it("creates trimmed action items and validates input", () => {
    const deadline = "2025-01-01T00:00:00.000Z";
    const actionItem = createActionItem({
      action: "  Publish DIS update ",
      owner: "  SOC Lead  ",
      deadline,
    });

    expect(actionItem).toEqual({
      action: "Publish DIS update",
      owner: "SOC Lead",
      deadline,
    });

    expect(() =>
      createActionItem({
        action: "",
        owner: "Analyst",
        deadline,
      }),
    ).toThrowError(/Action description/);

    expect(() =>
      createActionItem({
        action: "Draft follow-up",
        owner: " ",
        deadline,
      }),
    ).toThrowError(/Owner is required/);

    expect(() =>
      createActionItem({
        action: "Draft follow-up",
        owner: "Analyst",
        deadline: "2025-01-01",
      }),
    ).toThrowError(/Deadline/);
  });
});
