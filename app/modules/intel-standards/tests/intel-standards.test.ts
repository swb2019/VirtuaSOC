import { describe, it, expect } from "vitest";
import {
  createActionItem,
  createRiskMatrix,
  evaluateRisk,
  getConfidence,
  getSourceReliability,
  listConfidenceLevels,
  listSourceReliability,
  categorizeRisk,
} from "../src";

describe("intel-standards", () => {
  it("exposes the full source reliability catalog", () => {
    const catalog = listSourceReliability();
    expect(catalog).toHaveLength(6);
    expect(catalog.map((entry) => entry.code)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ]);
    expect(getSourceReliability("C").label).toContain("reliable");
  });

  it("throws for unknown source reliability codes", () => {
    expect(() => getSourceReliability("Z" as any)).toThrowError(
      /Unknown source reliability code/, 
    );
  });

  it("provides confidence metadata and enforces valid levels", () => {
    const levels = listConfidenceLevels();
    expect(levels).toHaveLength(3);
    expect(getConfidence("high").label).toBe("High confidence");
    expect(() => getConfidence("unknown" as any)).toThrowError(
      /Unknown confidence level/,
    );
  });

  it("calculates risk cells and categories across the matrix", () => {
    const assessment = evaluateRisk(4, 5);
    expect(assessment.score).toBe(20);
    expect(assessment.category).toBe("high");

    const matrix = createRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));
    expect(matrix[0][0].score).toBe(1);
    expect(matrix[0][0].category).toBe("informational");
    expect(matrix[4][4].score).toBe(25);
    expect(matrix[4][4].category).toBe("critical");

    expect(categorizeRisk(11)).toBe("moderate");
  });

  it("creates immutable action items with ISO deadlines", () => {
    const action = createActionItem({
      description: "Notify stakeholders",
      owner: "Ops",
      deadline: "2025-12-31T00:00:00Z",
    });

    expect(action.owner).toBe("Ops");
    expect(action.description).toBe("Notify stakeholders");
    expect(action.deadline).toBe("2025-12-31T00:00:00.000Z");
    expect(Object.isFrozen(action)).toBe(true);
  });

  it("rejects invalid action item inputs", () => {
    expect(() =>
      createActionItem({
        description: " ",
        owner: "Analyst",
        deadline: "2025-10-10T00:00:00Z",
      }),
    ).toThrowError(/Description is required/);

    expect(() =>
      createActionItem({
        description: "Do thing",
        owner: "",
        deadline: "2025-10-10T00:00:00Z",
      }),
    ).toThrowError(/Owner is required/);

    expect(() =>
      createActionItem({
        description: "Do thing",
        owner: "Lead",
        deadline: "not-a-date",
      }),
    ).toThrowError(/Deadline must be an ISO 8601/);
  });
});
