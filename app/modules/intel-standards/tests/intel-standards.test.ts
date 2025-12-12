import { describe, it, expect } from "vitest";
import {
  describeSourceReliability,
  describeConfidence,
  computeRiskScore,
  buildRiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards primitives", () => {
  it("maps source reliability codes to descriptive text", () => {
    expect(describeSourceReliability("A")).toMatch(/Completely reliable/);
    expect(describeSourceReliability("F")).toMatch(/Cannot be judged/);
  });

  it("maps confidence levels to descriptions", () => {
    expect(describeConfidence("high")).toMatch(/high-quality information/);
    expect(describeConfidence("low")).toMatch(/speculative/);
  });

  it("computes risk scores and categories from likelihood and impact", () => {
    const elevated = computeRiskScore(3, 5);
    expect(elevated).toEqual({
      likelihood: 3,
      impact: 5,
      value: 15,
      category: "elevated",
    });

    const critical = computeRiskScore(5, 5);
    expect(critical.category).toBe("critical");
    expect(critical.value).toBe(25);
  });

  it("builds an immutable 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();

    expect(matrix.length).toBe(5);
    matrix.forEach((row) => expect(row.length).toBe(5));

    const firstRow = matrix[0];
    const firstCell = firstRow[0];
    expect(firstCell).toEqual({
      likelihood: 1,
      impact: 1,
      value: 1,
      category: "low",
    });

    const lastCell = matrix[4][4];
    expect(lastCell.value).toBe(25);
    expect(lastCell.category).toBe("critical");

    expect(Object.isFrozen(matrix)).toBe(true);
    matrix.forEach((row) => expect(Object.isFrozen(row)).toBe(true));
  });

  it("creates normalized action items and validates inputs", () => {
    const action = createActionItem({
      description: "  Patch critical vuln  ",
      owner: "  SOC Runbooks  ",
      deadline: "2025-01-15",
    });

    expect(action.description).toBe("Patch critical vuln");
    expect(action.owner).toBe("SOC Runbooks");
    expect(action.deadline).toBe("2025-01-15T00:00:00.000Z");

    expect(() =>
      createActionItem({
        description: "",
        owner: "owner",
        deadline: "2025-01-01",
      }),
    ).toThrow(/description is required/);

    expect(() =>
      createActionItem({
        description: "Do thing",
        owner: "owner",
        deadline: "not-a-date",
      }),
    ).toThrow(/valid date/);
  });
});
