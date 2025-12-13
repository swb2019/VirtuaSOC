import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_LEVELS,
  describeSourceReliability,
  calculateRiskScore,
  riskCategoryFromScore,
  generateRiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("exposes the full source reliability scale", () => {
    expect(SOURCE_RELIABILITY_SCALE).toHaveLength(6);
    expect(describeSourceReliability("A").description).toContain("reliable");
    expect(() => describeSourceReliability("Z" as never)).toThrow(
      /unknown source reliability/i,
    );
  });

  it("lists the expected confidence levels", () => {
    expect(CONFIDENCE_LEVELS).toEqual(["high", "moderate", "low"]);
  });

  it("calculates risk scores and categories across boundaries", () => {
    expect(calculateRiskScore(3, 4)).toBe(12);
    expect(riskCategoryFromScore(4)).toBe("low");
    expect(riskCategoryFromScore(5)).toBe("moderate");
    expect(riskCategoryFromScore(16)).toBe("high");
    expect(riskCategoryFromScore(17)).toBe("critical");
  });

  it("generates the 5x5 risk matrix with correct extremes", () => {
    const matrix = generateRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const lowest = matrix[0][0];
    expect(lowest.score).toBe(1);
    expect(lowest.category).toBe("low");

    const highest = matrix[4][4];
    expect(highest.score).toBe(25);
    expect(highest.category).toBe("critical");
  });

  it("creates action items with normalized strings and ISO deadline", () => {
    const action = createActionItem({
      description: "  Patch VPN concentrator ",
      owner: "  SOC Manager ",
      deadline: "2025-01-31T12:00:00Z",
    });

    expect(action.description).toBe("Patch VPN concentrator");
    expect(action.owner).toBe("SOC Manager");
    expect(action.deadline).toBe("2025-01-31T12:00:00.000Z");
  });

  it("rejects invalid action inputs", () => {
    expect(() =>
      createActionItem({
        description: "",
        owner: "Analyst",
        deadline: "2025-02-01T00:00:00Z",
      }),
    ).toThrow(/description is required/i);

    expect(() =>
      createActionItem({
        description: "Ship patch",
        owner: "Analyst",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline must be a valid ISO 8601 date/i);
  });
});
