import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  getSourceReliability,
  createRiskAssessment,
  createActionItem,
} from "../src";

import type { LikelihoodLevel, ImpactLevel } from "../src";

describe("intel-standards", () => {
  it("exposes full source reliability scale", () => {
    const codes = Object.keys(SOURCE_RELIABILITY_SCALE);
    expect(codes).toHaveLength(6);

    const descriptor = getSourceReliability("A");
    expect(descriptor.label).toBe("Completely reliable");
    expect(descriptor.description.length).toBeGreaterThan(10);
  });

  it("calculates risk score and categories across thresholds", () => {
    const cases: Array<{
      likelihood: LikelihoodLevel;
      impact: ImpactLevel;
      expectedScore: number;
      expectedCategory: string;
    }> = [
      { likelihood: 1, impact: 5, expectedScore: 5, expectedCategory: "low" },
      { likelihood: 2, impact: 4, expectedScore: 8, expectedCategory: "moderate" },
      { likelihood: 4, impact: 4, expectedScore: 16, expectedCategory: "high" },
      { likelihood: 5, impact: 5, expectedScore: 25, expectedCategory: "critical" },
    ];

    for (const testCase of cases) {
      const assessment = createRiskAssessment({
        likelihood: testCase.likelihood,
        impact: testCase.impact,
      });
      expect(assessment.score).toBe(testCase.expectedScore);
      expect(assessment.category).toBe(testCase.expectedCategory);
    }
  });

  it("rejects invalid risk inputs", () => {
    expect(() =>
      createRiskAssessment({
        likelihood: 0 as LikelihoodLevel,
        impact: 3,
      }),
    ).toThrow(/between 1 and 5/);
  });

  it("normalizes action items", () => {
    const deadline = "2025-12-31T23:59:00Z";
    const action = createActionItem({
      description: "  Deliver FLASH alert  ",
      owner: "  Duty Officer  ",
      deadline,
    });

    expect(action.description).toBe("Deliver FLASH alert");
    expect(action.owner).toBe("Duty Officer");
    expect(action.deadline).toBe(new Date(deadline).toISOString());
  });

  it("throws on invalid action item deadline", () => {
    expect(() =>
      createActionItem({
        description: "Publish DIS",
        owner: "Intel Lead",
        deadline: "2025-12-31",
      }),
    ).toThrow(/ISO-8601/);
  });
});
