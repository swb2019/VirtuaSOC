import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  getSourceReliabilityDescriptor,
  CONFIDENCE_LEVELS,
  isConfidenceLevel,
  calculateRiskScore,
  RISK_MATRIX,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("exposes the AF source reliability descriptors", () => {
    const codes = SOURCE_RELIABILITY_SCALE.map((entry) => entry.code);
    expect(codes).toEqual(["A", "B", "C", "D", "E", "F"]);

    const descriptor = getSourceReliabilityDescriptor("C");
    expect(descriptor.label).toContain("Fairly Reliable");
    expect(descriptor.description.length).toBeGreaterThan(10);
  });

  it("validates confidence levels", () => {
    expect(CONFIDENCE_LEVELS).toEqual(["high", "moderate", "low"]);
    expect(isConfidenceLevel("moderate")).toBe(true);
    expect(isConfidenceLevel("unknown")).toBe(false);
    expect(isConfidenceLevel(42)).toBe(false);
  });

  it("derives risk scores and levels deterministically", () => {
    const score = calculateRiskScore(5, 4);
    expect(score.value).toBe(20);
    expect(score.level).toBe("critical");

    const moderateScore = calculateRiskScore(2, 3);
    expect(moderateScore.value).toBe(6);
    expect(moderateScore.level).toBe("moderate");

    expect(() => calculateRiskScore(0 as 1, 3)).toThrow(
      /likelihood must be an integer/,
    );
    expect(() => calculateRiskScore(2, 6 as 5)).toThrow(
      /impact must be an integer/,
    );
  });

  it("builds a frozen 5x5 risk matrix", () => {
    const row = RISK_MATRIX[3];
    expect(row[5].value).toBe(15);
    expect(row[5].level).toBe("high");

    const diagonal = RISK_MATRIX[4][4];
    expect(diagonal.value).toBe(16);
    expect(diagonal.level).toBe("critical");

    expect(() => {
      // Cast away readonly to attempt a mutation at runtime.
      (row as Record<number, unknown>)[5] = {
        likelihood: 0,
        impact: 0,
        value: 0,
        level: "low",
      };
    }).toThrow();
    expect(RISK_MATRIX[3][5].value).toBe(15);
  });

  it("creates validated action items", () => {
    const action = createActionItem({
      summary: "Notify customers",
      owner: "SOC Lead",
      deadline: "2025-01-30T00:00:00.000Z",
    });

    expect(action.status).toBe("pending");
    expect(action.deadline).toBe("2025-01-30T00:00:00.000Z");
    expect(action.owner).toBe("SOC Lead");
  });

  it("rejects invalid action item input", () => {
    expect(() =>
      createActionItem({
        summary: "",
        owner: "Alice",
        deadline: "2025-01-30T00:00:00.000Z",
      }),
    ).toThrow(/summary must be a non-empty string/);

    expect(() =>
      createActionItem({
        summary: "Coordinate response",
        owner: "",
        deadline: "2025-01-30T00:00:00.000Z",
      }),
    ).toThrow(/owner must be a non-empty string/);

    expect(() =>
      createActionItem({
        summary: "Validate fix",
        owner: "IR Lead",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline must be a valid ISO-8601/);

    expect(() =>
      createActionItem({
        summary: "Ship patch",
        owner: "Ops",
        deadline: "2025-01-30T00:00:00.000Z",
        status: "blocked" as never,
      }),
    ).toThrow(/status must be pending, in_progress, or done/);
  });
});
