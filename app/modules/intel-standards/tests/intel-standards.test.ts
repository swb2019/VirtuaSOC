import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  describeSourceReliability,
  isSourceReliabilityCode,
  describeConfidence,
  compareConfidence,
  calculateRiskScore,
  classifyRisk,
  buildRiskMatrix,
  createActionItem,
  completeActionItem,
  isActionItemOverdue,
} from "../src";

describe("intel-standards", () => {
  it("exposes canonical source reliability definitions", () => {
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ]);

    const definition = describeSourceReliability("A");
    expect(definition.label).toContain("reliable");
    expect(definition.description.length).toBeGreaterThan(10);
    expect(isSourceReliabilityCode("Z")).toBe(false);
  });

  it("orders confidence levels high > moderate > low", () => {
    const high = describeConfidence("high");
    const low = describeConfidence("low");

    expect(high.rank).toBeGreaterThan(low.rank);
    expect(compareConfidence("high", "low")).toBeGreaterThan(0);
    expect(compareConfidence("low", "high")).toBeLessThan(0);
    expect(compareConfidence("moderate", "moderate")).toBe(0);
  });

  it("calculates risk scores and ratings for the 5x5 matrix", () => {
    expect(calculateRiskScore(5, 5)).toBe(25);
    expect(classifyRisk(25)).toBe("extreme");
    expect(classifyRisk(3 * 3)).toBe("moderate");

    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row, likelihoodIdx) => {
      expect(row).toHaveLength(5);
      row.forEach((cell, impactIdx) => {
        expect(cell.likelihood).toBe(likelihoodIdx + 1);
        expect(cell.impact).toBe(impactIdx + 1);
        expect(cell.score).toBe((likelihoodIdx + 1) * (impactIdx + 1));
        expect(["low", "moderate", "high", "extreme"]).toContain(cell.rating);
      });
    });
  });

  it("creates and manages action items with ISO deadlines", () => {
    const action = createActionItem({
      owner: "Analyst A",
      action: "Draft key judgments",
      deadline: "2025-01-15T12:00:00Z",
    });

    expect(action.owner).toBe("Analyst A");
    expect(action.action).toBe("Draft key judgments");
    expect(action.status).toBe("pending");
    expect(() => new Date(action.deadline)).not.toThrow();

    const referenceDate = new Date("2025-02-01T00:00:00Z");
    expect(isActionItemOverdue(action, referenceDate)).toBe(true);

    const completed = completeActionItem(action);
    expect(completed.status).toBe("completed");
    expect(isActionItemOverdue(completed, referenceDate)).toBe(false);
  });

  it("validates inputs and surfaces helpful errors", () => {
    expect(() => classifyRisk(0)).toThrow(/between 1 and 25/);
    expect(() =>
      createActionItem({
        owner: "   ",
        action: "Follow up",
        deadline: "2025-02-01",
      }),
    ).toThrow(/owner/);
    expect(() =>
      createActionItem({
        owner: "Analyst",
        action: "  ",
        deadline: "2025-02-01",
      }),
    ).toThrow(/action/);
    expect(() =>
      createActionItem({
        owner: "Analyst",
        action: "Follow up",
        deadline: "invalid-date",
      }),
    ).toThrow(/deadline/);
  });
});
