import { describe, expect, it } from "vitest";
import {
  buildRiskMatrix,
  calculateRiskScore,
  ConfidenceLevel,
  createActionItem,
  describeConfidenceLevel,
  describeSourceReliability,
  SourceReliabilityGrade,
} from "../src";

describe("intel-standards primitives", () => {
  it("describes AF source reliability grades", () => {
    const info = describeSourceReliability("C");
    expect(info).toEqual<{
      grade: SourceReliabilityGrade;
      description: string;
    }>({
      grade: "C",
      description: "Fairly reliable source",
    });
  });

  it("describes confidence levels", () => {
    const info = describeConfidenceLevel("moderate");
    expect(info.level).toBe<ConfidenceLevel>("moderate");
    expect(info.description).toContain("credible");
  });

  it("scores and buckets risks using severity bands", () => {
    const scenarios: Array<[number, number, string]> = [
      [1, 1, "minimal"],
      [2, 3, "low"],
      [3, 4, "moderate"],
      [4, 5, "high"],
      [5, 5, "critical"],
    ];

    scenarios.forEach(([likelihood, impact, severity]) => {
      const score = calculateRiskScore(
        likelihood as 1 | 2 | 3 | 4 | 5,
        impact as 1 | 2 | 3 | 4 | 5,
      );
      expect(score.severity).toBe(severity);
      expect(score.score).toBe(likelihood * impact);
    });
  });

  it("builds a 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row, idx) => {
      expect(row.likelihood).toBe(idx + 1);
      expect(row.entries).toHaveLength(5);
    });

    const highImpactCritical = matrix[4].entries[4];
    expect(highImpactCritical.score).toBe(25);
    expect(highImpactCritical.severity).toBe("critical");
  });

  it("creates action items with normalized ISO deadlines", () => {
    const deadline = new Date("2025-12-31T00:00:00Z");
    const action = createActionItem({
      description: "Notify stakeholders",
      owner: "Ops",
      deadline,
      status: "in-progress",
    });

    expect(action.description).toBe("Notify stakeholders");
    expect(action.owner).toBe("Ops");
    expect(action.deadline).toBe(deadline.toISOString());
    expect(action.status).toBe("in-progress");
    expect(action.id).toMatch(/-/);
  });

  it("rejects invalid deadlines", () => {
    expect(() =>
      createActionItem({
        description: "Invalid deadline",
        owner: "QA",
        deadline: "not-a-date",
      }),
    ).toThrow(/Invalid action item deadline/);
  });
});
