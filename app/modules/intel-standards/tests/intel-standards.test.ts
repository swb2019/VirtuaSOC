import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_SCALE,
  describeSourceReliability,
  describeConfidence,
  calculateRiskScore,
  deriveRiskRating,
  createRiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("exposes the full source reliability scale (A-F)", () => {
    expect(SOURCE_RELIABILITY_SCALE).toHaveLength(6);
    expect(describeSourceReliability("A").label).toBe("Completely reliable");
    expect(describeSourceReliability("F").description).toContain(
      "Insufficient information",
    );
  });

  it("describes analytic confidence levels", () => {
    expect(CONFIDENCE_SCALE.map((c) => c.level)).toEqual([
      "high",
      "moderate",
      "low",
    ]);
    expect(describeConfidence("moderate").description).toContain("gaps");
  });

  it("calculates risk scores and ratings", () => {
    expect(calculateRiskScore(5, 5)).toBe(25);
    expect(deriveRiskRating(25)).toBe("critical");
    expect(deriveRiskRating(10)).toBe("moderate");
    expect(deriveRiskRating(4)).toBe("low");
  });

  it("produces a 5x5 risk matrix with consistent scoring", () => {
    const matrix = createRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const topLeft = matrix[0][0];
    expect(topLeft.score).toBe(1);
    expect(topLeft.rating).toBe("low");

    const bottomRight = matrix[4][4];
    expect(bottomRight.score).toBe(25);
    expect(bottomRight.rating).toBe("critical");
  });

  it("creates normalized action items with ISO deadlines", () => {
    const action = createActionItem({
      action: "  Notify analysts ",
      owner: "  Ops Lead ",
      deadline: "2025-01-31T00:00:00.000Z",
    });

    expect(action).toEqual({
      action: "Notify analysts",
      owner: "Ops Lead",
      deadline: "2025-01-31T00:00:00.000Z",
    });

    const withDate = createActionItem({
      action: "Publish DIS",
      owner: "Intel Chief",
      deadline: new Date("2025-02-01T00:00:00.000Z"),
    });
    expect(withDate.deadline).toBe("2025-02-01T00:00:00.000Z");
  });

  it("rejects invalid deadlines", () => {
    expect(() =>
      createActionItem({
        action: "Send flash alert",
        owner: "Duty Officer",
        deadline: "not-a-date",
      }),
    ).toThrowError("deadline must be a valid ISO 8601 date");
  });
});
