import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_LEVELS,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
} from "../src";

const RELIABILITY_CODES = ["A", "B", "C", "D", "E", "F"] as const;

describe("intel-standards", () => {
  it("exposes AF reliability descriptors for all codes", () => {
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toEqual(
      RELIABILITY_CODES,
    );
    expect(SOURCE_RELIABILITY_SCALE.A.label.toLowerCase()).toContain(
      "reliable",
    );
    expect(SOURCE_RELIABILITY_SCALE.F.description.length).toBeGreaterThan(10);
  });

  it("provides ICD-203 confidence descriptors", () => {
    expect(Object.keys(CONFIDENCE_LEVELS)).toEqual([
      "high",
      "moderate",
      "low",
    ]);
    expect(CONFIDENCE_LEVELS.high.description).toContain("corroborated");
  });

  it("computes risk score severity tiers", () => {
    const high = calculateRiskScore(5, 4);
    expect(high.score).toBe(20);
    expect(high.severity).toBe("high");

    const critical = calculateRiskScore(5, 5);
    expect(critical.score).toBe(25);
    expect(critical.severity).toBe("critical");
  });

  it("builds a 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const topLeft = matrix[0][0];
    expect(topLeft.score).toBe(1);
    expect(topLeft.severity).toBe("very_low");

    const bottomRight = matrix[4][4];
    expect(bottomRight.score).toBe(25);
    expect(bottomRight.severity).toBe("critical");

    const uniqueScores = new Set(
      matrix.flat().map((cell) => `${cell.likelihood}-${cell.impact}`),
    );
    expect(uniqueScores.size).toBe(25);
  });

  it("creates normalized action items with ISO deadlines", () => {
    const deadline = new Date("2025-01-01T00:00:00Z");
    const action = createActionItem({
      action: "Notify stakeholder",
      owner: "Ops",
      deadline,
    });

    expect(action.deadline).toBe(deadline.toISOString());
    expect(action.status).toBe("pending");
  });

  it("rejects invalid action item inputs", () => {
    expect(() =>
      createActionItem({
        action: " ",
        owner: "Ops",
        deadline: "2025-01-01",
      }),
    ).toThrow(/action is required/i);

    expect(() =>
      createActionItem({
        action: "Do thing",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/);
  });
});
