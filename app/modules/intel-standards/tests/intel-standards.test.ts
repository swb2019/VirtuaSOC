import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_GRADES,
  CONFIDENCE_LEVELS,
  describeSourceReliability,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
} from "../src";

import type { RiskMatrix, RiskScore, SourceReliabilityDescriptor } from "../src";

describe("intel-standards", () => {
  it("provides descriptors for every reliability grade", () => {
    const descriptors: SourceReliabilityDescriptor[] = SOURCE_RELIABILITY_GRADES.map(
      (grade) => describeSourceReliability(grade),
    );

    expect(descriptors).toHaveLength(6);
    descriptors.forEach((entry, idx) => {
      expect(entry.grade).toBe(SOURCE_RELIABILITY_GRADES[idx]);
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    });
  });

  it("calculates risk scores with expected severities", () => {
    const cases: Array<{
      likelihood: number;
      impact: number;
      severity: RiskScore["severity"];
      score: number;
    }> = [
      { likelihood: 1, impact: 1, severity: "minimal", score: 1 },
      { likelihood: 2, impact: 3, severity: "low", score: 6 },
      { likelihood: 3, impact: 4, severity: "moderate", score: 12 },
      { likelihood: 3, impact: 5, severity: "high", score: 15 },
      { likelihood: 5, impact: 5, severity: "critical", score: 25 },
    ];

    cases.forEach(({ likelihood, impact, severity, score }) => {
      const result = calculateRiskScore(likelihood as never, impact as never);
      expect(result.score).toBe(score);
      expect(result.severity).toBe(severity);
    });

    expect(() => calculateRiskScore(0 as never, 3 as never)).toThrow();
    expect(() => calculateRiskScore(3 as never, 7 as never)).toThrow();
  });

  it("builds a 5x5 risk matrix covering every likelihood/impact pair", () => {
    const matrix: RiskMatrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const bottomRight = matrix.at(-1)?.at(-1);
    expect(bottomRight?.score).toBe(25);
    expect(bottomRight?.severity).toBe("critical");

    const topLeft = matrix[0][0];
    expect(topLeft.score).toBe(1);
    expect(topLeft.severity).toBe("minimal");
  });

  it("creates action items with normalized ISO deadlines", () => {
    const action = createActionItem({
      description: "Notify tenant of DIS publication",
      owner: "intel.ops",
      deadline: "2025-01-31",
    });

    expect(action.description).toBe("Notify tenant of DIS publication");
    expect(action.owner).toBe("intel.ops");
    expect(action.deadline).toMatch(/T00:00:00\.000Z$/);

    expect(() =>
      createActionItem({
        description: "",
        owner: "ops",
        deadline: "2025-01-31",
      }),
    ).toThrow();

    expect(() =>
      createActionItem({
        description: "Alert leadership",
        owner: "",
        deadline: "2025-01-31",
      }),
    ).toThrow();

    expect(() =>
      createActionItem({
        description: "bad deadline",
        owner: "ops",
        deadline: "invalid",
      }),
    ).toThrow();
  });

  it("documents confidence levels for clarity", () => {
    expect(CONFIDENCE_LEVELS).toEqual(["high", "moderate", "low"]);
  });
});
