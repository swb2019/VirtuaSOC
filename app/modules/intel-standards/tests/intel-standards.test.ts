import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_DESCRIPTIONS,
  describeSourceReliability,
  confidenceRank,
  calculateRiskScore,
  createRiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("describes each source reliability code", () => {
    expect(Object.keys(SOURCE_RELIABILITY_DESCRIPTIONS)).toHaveLength(6);
    expect(describeSourceReliability("A")).toMatch(/Completely reliable/);
    expect(describeSourceReliability("F")).toMatch(/cannot be judged/);
  });

  it("orders confidence levels from low to high", () => {
    const low = confidenceRank("low");
    const mod = confidenceRank("moderate");
    const high = confidenceRank("high");

    expect(low).toBeLessThan(mod);
    expect(mod).toBeLessThan(high);
  });

  it("calculates risk score and banding correctly", () => {
    const score = calculateRiskScore(3, 5);
    expect(score.value).toBe(15);
    expect(score.band).toBe("high");

    const lowScore = calculateRiskScore(1, 5);
    expect(lowScore.value).toBe(5);
    expect(lowScore.band).toBe("low");
  });

  it("builds a full 5x5 risk matrix", () => {
    const matrix = createRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const topLeft = matrix[0][0];
    const bottomRight = matrix[4][4];
    expect(topLeft.value).toBe(1);
    expect(bottomRight.value).toBe(25);
    expect(bottomRight.band).toBe("critical");
  });

  it("creates action items with trimmed strings and ISO deadlines", () => {
    const actionItem = createActionItem({
      action: "  Draft DIS ",
      owner: " Analyst ",
      deadline: "2025-01-01",
    });

    expect(actionItem.action).toBe("Draft DIS");
    expect(actionItem.owner).toBe("Analyst");
    expect(actionItem.deadline).toBe("2025-01-01T00:00:00.000Z");
  });

  it("rejects invalid deadlines", () => {
    expect(() =>
      createActionItem({
        action: "Publish",
        owner: "Lead",
        deadline: "not-a-date",
      }),
    ).toThrow(/valid date/);
  });
});
