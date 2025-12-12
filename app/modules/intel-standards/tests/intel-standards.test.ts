import { describe, it, expect } from "vitest";
import {
  describeSourceReliability,
  describeConfidence,
  calculateRiskScore,
  RISK_MATRIX,
  createActionItem,
  SourceReliability,
  ConfidenceLevel,
} from "../src";

describe("intel-standards", () => {
  it("returns AF descriptions for each source reliability letter", () => {
    const letters: SourceReliability[] = ["A", "B", "C", "D", "E", "F"];
    letters.forEach((letter) => {
      const description = describeSourceReliability(letter);
      expect(description.length).toBeGreaterThan(0);
      if (letter === "A") {
        expect(description).toContain("Completely reliable");
      }
      if (letter === "F") {
        expect(description).toContain("cannot be judged");
      }
    });
  });

  it("describes confidence levels", () => {
    const expectations: Record<ConfidenceLevel, string> = {
      high: "High confidence",
      moderate: "Moderate confidence",
      low: "Low confidence",
    };

    (Object.keys(expectations) as ConfidenceLevel[]).forEach((level) => {
      expect(describeConfidence(level)).toContain(expectations[level]);
    });
  });

  it("calculates risk score bands across thresholds", () => {
    expect(calculateRiskScore(1, 5)).toMatchObject({ band: "low", score: 5 });
    expect(calculateRiskScore(3, 4)).toMatchObject({ band: "moderate", score: 12 });
    expect(calculateRiskScore(4, 4)).toMatchObject({ band: "high", score: 16 });
    expect(calculateRiskScore(5, 5)).toMatchObject({ band: "critical", score: 25 });
  });

  it("exposes a 5x5 risk matrix covering every combination", () => {
    expect(RISK_MATRIX.length).toBe(5);
    RISK_MATRIX.forEach((row) => expect(row.length).toBe(5));

    const combos = new Set(
      RISK_MATRIX.flat().map((cell) => `${cell.likelihood}-${cell.impact}`),
    );
    expect(combos.size).toBe(25);
    expect(RISK_MATRIX[4][4].score).toBe(25);
  });

  it("creates normalized action items and enforces ISO deadlines", () => {
    const action = createActionItem({
      description: "  Draft DIS summary  ",
      owner: "  intel-lead  ",
      deadline: "2025-12-01T00:00:00Z",
    });

    expect(action).toMatchObject({
      description: "Draft DIS summary",
      owner: "intel-lead",
      status: "pending",
    });
    expect(action.deadline).toBe("2025-12-01T00:00:00.000Z");
  });

  it("rejects missing owner or invalid deadlines", () => {
    expect(() =>
      createActionItem({
        description: "Task",
        owner: " ",
        deadline: "2025-12-01T00:00:00Z",
      }),
    ).toThrow(/owner/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "lead",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/);
  });
});
