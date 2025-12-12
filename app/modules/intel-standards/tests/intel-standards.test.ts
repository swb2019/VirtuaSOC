import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  getSourceReliability,
  CONFIDENCE_LEVELS,
  getConfidenceDescriptor,
  calculateRiskScore,
  createRiskMatrix,
  createActionItem,
  SourceReliabilityCode,
  ConfidenceLevel,
  LikelihoodLevel,
  ImpactLevel,
} from "../src";

describe("intel-standards", () => {
  it("provides descriptors for every source reliability code", () => {
    const codes = SOURCE_RELIABILITY_SCALE.map((entry) => entry.code);
    expect(codes).toEqual(["A", "B", "C", "D", "E", "F"]);

    const descriptor = getSourceReliability("A");
    expect(descriptor.label).toContain("Completely reliable");

    expect(() =>
      getSourceReliability("Z" as SourceReliabilityCode),
    ).toThrow(/Unknown source reliability code/);
  });

  it("provides descriptors for confidence levels", () => {
    const levels = CONFIDENCE_LEVELS.map((entry) => entry.level);
    const expectedOrder: ConfidenceLevel[] = ["high", "moderate", "low"];
    expect(levels).toEqual(expectedOrder);

    const descriptor = getConfidenceDescriptor("moderate");
    expect(descriptor.description).toContain("credible");

    expect(() => getConfidenceDescriptor("none" as ConfidenceLevel)).toThrow(
      /Unknown confidence level/,
    );
  });

  it("calculates bounded risk scores", () => {
    expect(calculateRiskScore(3, 5)).toBe(15);
    expect(calculateRiskScore(1, 1)).toBe(1);
    expect(calculateRiskScore(5, 5)).toBe(25);

    expect(() =>
      calculateRiskScore(0 as unknown as LikelihoodLevel, 2 as ImpactLevel),
    ).toThrow(/Likelihood must be an integer between 1 and 5/);
  });

  it("creates a canonical 5x5 risk matrix", () => {
    const matrix = createRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    expect(matrix[0]?.[0]?.score).toBe(1);
    expect(matrix[4]?.[4]?.score).toBe(25);
  });

  it("creates normalized action items", () => {
    const action = createActionItem({
      description: "  Draft DIS key judgments  ",
      owner: "  Analyst 1 ",
      deadline: "2025-01-31T12:00:00Z",
    });

    expect(action.description).toBe("Draft DIS key judgments");
    expect(action.owner).toBe("Analyst 1");
    expect(action.deadline).toBe("2025-01-31T12:00:00.000Z");
  });

  it("rejects invalid action items", () => {
    expect(() =>
      createActionItem({
        description: "",
        owner: "Ops",
        deadline: "2025-01-01",
      }),
    ).toThrow(/Description is required/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: " ",
        deadline: "2025-01-01",
      }),
    ).toThrow(/Owner is required/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/Deadline must be a valid date/);
  });
});
