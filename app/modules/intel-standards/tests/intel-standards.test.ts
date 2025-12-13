import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_SCALE,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("defines the full AF source reliability scale", () => {
    expect(SOURCE_RELIABILITY_SCALE).toHaveLength(6);
    expect(SOURCE_RELIABILITY_SCALE.map((entry) => entry.code)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ]);
  });

  it("exposes the ICD-style confidence levels", () => {
    expect(CONFIDENCE_SCALE).toHaveLength(3);
    expect(CONFIDENCE_SCALE.map((entry) => entry.level)).toEqual([
      "high",
      "moderate",
      "low",
    ]);
  });

  it("calculates risk scores with the correct bands", () => {
    const low = calculateRiskScore(1, 5);
    const high = calculateRiskScore(5, 4);
    const critical = calculateRiskScore(5, 5);

    expect(low).toMatchObject({ score: 5, band: "low" });
    expect(high).toMatchObject({ score: 20, band: "high" });
    expect(critical).toMatchObject({ score: 25, band: "critical" });
  });

  it("builds a 5x5 risk matrix with monotonic scores", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    expect(matrix[0][0]).toMatchObject({ score: 1, band: "minimal" });
    expect(matrix[4][4]).toMatchObject({ score: 25, band: "critical" });

    const flatScores = matrix.flat().map((cell) => cell.score);
    expect(Math.min(...flatScores)).toBe(1);
    expect(Math.max(...flatScores)).toBe(25);
  });

  it("normalizes action items and enforces ISO deadlines", () => {
    const item = createActionItem({
      summary: "  Patch flash alert workflow  ",
      owner: "  intel-lead  ",
      deadline: "2025-02-15",
    });

    expect(item.summary).toBe("Patch flash alert workflow");
    expect(item.owner).toBe("intel-lead");
    expect(item.status).toBe("open");
    expect(item.deadline).toBe(new Date("2025-02-15").toISOString());
  });

  it("rejects invalid action item input", () => {
    expect(() =>
      createActionItem({
        summary: "",
        owner: "ops",
        deadline: "2025-01-01",
      }),
    ).toThrow(/summary is required/);

    expect(() =>
      createActionItem({
        summary: "Valid",
        owner: "ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline must be a valid date/);
  });
});
