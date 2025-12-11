import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  getSourceReliabilityDefinition,
  CONFIDENCE_SCALE,
  getConfidenceDefinition,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("exposes all source reliability codes with descriptions", () => {
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ]);

    const def = getSourceReliabilityDefinition("A");
    expect(def.label).toBe("Completely Reliable");
    expect(def.description.length).toBeGreaterThan(10);
  });

  it("provides confidence definitions", () => {
    expect(Object.keys(CONFIDENCE_SCALE)).toEqual(["high", "moderate", "low"]);
    expect(getConfidenceDefinition("moderate").description).toContain(
      "evidence",
    );
  });

  it("calculates risk score classifications", () => {
    expect(calculateRiskScore(1, 4)).toMatchObject({
      value: 4,
      classification: "low",
    });
    expect(calculateRiskScore(3, 3)).toMatchObject({
      value: 9,
      classification: "moderate",
    });
    expect(calculateRiskScore(4, 4)).toMatchObject({
      value: 16,
      classification: "high",
    });
    expect(calculateRiskScore(5, 5)).toMatchObject({
      value: 25,
      classification: "critical",
    });
  });

  it("builds a 5x5 risk matrix derived from the scoring function", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row, idx) => {
      expect(row).toHaveLength(5);
      row.forEach((cell, jdx) => {
        expect(cell.likelihood).toBe(idx + 1);
        expect(cell.impact).toBe(jdx + 1);
        expect(cell.value).toBe((idx + 1) * (jdx + 1));
      });
    });
  });

  it("normalizes action items and validates required fields", () => {
    const action = createActionItem({
      summary: "  Notify client ",
      owner: " Alex Analyst ",
      deadline: "2025-12-01T10:00:00Z",
    });

    expect(action.summary).toBe("Notify client");
    expect(action.owner).toBe("Alex Analyst");
    expect(action.status).toBe("planned");
    expect(action.deadline).toBe("2025-12-01T10:00:00.000Z");

    expect(() =>
      createActionItem({
        summary: "",
        owner: "Ops",
        deadline: "2025-01-01",
      }),
    ).toThrow(/summary/i);

    expect(() =>
      createActionItem({
        summary: "Notify",
        owner: "",
        deadline: "2025-01-01",
      }),
    ).toThrow(/owner/i);

    expect(() =>
      createActionItem({
        summary: "Notify",
        owner: "Ops",
        deadline: "invalid-date",
      }),
    ).toThrow(/deadline/i);
  });
});
