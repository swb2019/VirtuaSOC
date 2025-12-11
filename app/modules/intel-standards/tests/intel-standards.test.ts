import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_LEVELS,
  SOURCE_RELIABILITY_SCALE,
  buildRiskMatrix,
  calculateRiskScore,
  createActionItem,
  isActionItemOverdue,
} from "../src";

const EXPECTED_RELIABILITY_SCALE = ["A", "B", "C", "D", "E", "F"];
const EXPECTED_CONFIDENCE = ["high", "moderate", "low"];

describe("intel-standards", () => {
  it("exposes the AF reliability scale in order", () => {
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toEqual(
      EXPECTED_RELIABILITY_SCALE,
    );
    expect(SOURCE_RELIABILITY_SCALE.A).toContain("reliable");
  });

  it("lists confidence levels from highest to lowest", () => {
    expect([...CONFIDENCE_LEVELS]).toEqual(EXPECTED_CONFIDENCE);
  });

  it("derives risk score values and qualitative categories", () => {
    expect(calculateRiskScore(2, 2)).toMatchObject({
      value: 4,
      category: "low",
    });
    expect(calculateRiskScore(4, 4)).toMatchObject({
      value: 16,
      category: "high",
    });
    expect(calculateRiskScore(5, 5)).toMatchObject({
      value: 25,
      category: "critical",
    });
  });

  it("builds a full 5x5 risk matrix without duplicates", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    const combinations = new Set<string>();

    matrix.forEach((row) => {
      expect(row).toHaveLength(5);
      row.forEach((cell) => {
        combinations.add(`${cell.likelihood}-${cell.impact}`);
      });
    });

    expect(combinations.size).toBe(25);
  });

  it("creates normalized action items and detects overdue status", () => {
    const action = createActionItem({
      description: "  Draft DIS key judgments  ",
      owner: "  Analyst A  ",
      deadline: "2025-01-10T00:00:00.000Z",
    });

    expect(action.description).toBe("Draft DIS key judgments");
    expect(action.owner).toBe("Analyst A");
    expect(action.status).toBe("pending");
    expect(action.deadline).toBe("2025-01-10T00:00:00.000Z");

    const overdue = isActionItemOverdue(action, "2025-02-01T00:00:00.000Z");
    expect(overdue).toBe(true);

    const complete = createActionItem({
      description: "Ship Flash Alert",
      owner: "Lead",
      deadline: "2025-01-01T00:00:00.000Z",
      status: "complete",
    });
    expect(isActionItemOverdue(complete, "2025-02-01T00:00:00.000Z")).toBe(
      false,
    );
  });

  it("validates deadlines", () => {
    expect(() =>
      createActionItem({
        description: "Invalid deadline",
        owner: "Test",
        deadline: "not-a-date",
      }),
    ).toThrowError();
  });
});
