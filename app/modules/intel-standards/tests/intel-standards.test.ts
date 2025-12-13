import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_SCALE,
  describeSourceReliability,
  describeConfidence,
  calculateRiskScore,
  classifyRisk,
  buildRiskMatrix,
  createActionItem,
  ActionItemStatus,
} from "../src";

describe("intel-standards", () => {
  it("exposes all source reliability descriptors", () => {
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toHaveLength(6);

    const descriptor = describeSourceReliability("A");
    expect(descriptor.label).toMatch(/completely reliable/i);
    expect(descriptor.description.length).toBeGreaterThan(10);
  });

  it("describes confidence levels", () => {
    expect(Object.keys(CONFIDENCE_SCALE)).toEqual([
      "high",
      "moderate",
      "low",
    ]);

    const descriptor = describeConfidence("moderate");
    expect(descriptor.description).toMatch(/gaps/i);
  });

  it("calculates and classifies risk scores", () => {
    const score = calculateRiskScore(3, 4);
    expect(score).toBe(12);
    expect(classifyRisk(score)).toBe("moderate");

    const highScore = calculateRiskScore(5, 4);
    expect(classifyRisk(highScore)).toBe("critical");
  });

  it("builds a 5x5 risk matrix with consistent metadata", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const cell = matrix[4][4];
    expect(cell.likelihood).toBe(5);
    expect(cell.impact).toBe(5);
    expect(cell.score).toBe(25);
    expect(cell.classification).toBe("critical");
  });

  it("creates normalized action items with ISO deadlines", () => {
    const action = createActionItem({
      action: "  Notify leadership  ",
      owner: "  lead@virtua  ",
      deadline: "2025-12-31",
    });

    expect(action.action).toBe("Notify leadership");
    expect(action.owner).toBe("lead@virtua");
    expect(action.deadline).toBe("2025-12-31T00:00:00.000Z");
    expect(action.status).toBe<ActionItemStatus>("pending");
  });

  it("rejects invalid deadlines", () => {
    expect(() =>
      createActionItem({
        action: "Test",
        owner: "ops",
        deadline: "not-a-date",
      }),
    ).toThrowError(/invalid deadline/i);
  });
});
