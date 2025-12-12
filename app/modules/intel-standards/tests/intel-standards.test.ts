import { describe, it, expect } from "vitest";

import {
  SOURCE_RELIABILITY_ENTRIES,
  CONFIDENCE_ENTRIES,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  getSourceReliability,
  getConfidenceDescriptor,
} from "../src";

describe("intel-standards", () => {
  it("exposes all source reliability descriptors (A-F)", () => {
    expect(SOURCE_RELIABILITY_ENTRIES).toHaveLength(6);
    const codes = SOURCE_RELIABILITY_ENTRIES.map((entry) => entry.code);
    expect(codes).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(getSourceReliability("A").label).toContain("reliable");
  });

  it("exposes confidence descriptors for high/moderate/low", () => {
    expect(CONFIDENCE_ENTRIES).toHaveLength(3);
    expect(getConfidenceDescriptor("moderate").description).toContain(
      "credibly",
    );
  });

  it("calculates risk score classification using likelihood × impact", () => {
    expect(calculateRiskScore(1, 1)).toMatchObject({
      score: 1,
      classification: "minimal",
    });
    expect(calculateRiskScore(5, 5)).toMatchObject({
      score: 25,
      classification: "critical",
    });
    expect(calculateRiskScore(3, 4)).toMatchObject({
      score: 12,
      classification: "moderate",
    });
  });

  it("builds a 5x5 risk matrix covering every combination", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));
    expect(matrix[0][0]).toMatchObject({ likelihood: 1, impact: 1, score: 1 });
    expect(matrix[4][4]).toMatchObject({ likelihood: 5, impact: 5, score: 25 });
  });

  it("validates and normalizes action items", () => {
    const item = createActionItem({
      description: "  Notify customer  ",
      owner: "  intel lead ",
      deadline: "2025-01-01T00:00:00Z",
    });
    expect(item.description).toBe("Notify customer");
    expect(item.owner).toBe("intel lead");
    expect(item.deadline).toBe("2025-01-01T00:00:00.000Z");
    expect(Object.isFrozen(item)).toBe(true);

    expect(() =>
      createActionItem({
        description: "  ",
        owner: "owner",
        deadline: "2025-01-01",
      }),
    ).toThrow(/description is required/);
    expect(() =>
      createActionItem({
        description: "Task",
        owner: "owner",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline must be a valid ISO 8601/);
  });
});
