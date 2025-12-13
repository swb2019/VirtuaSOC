import { describe, expect, it } from "vitest";
import {
  ActionItem,
  ActionStatus,
  SourceReliability,
  calculateRiskScore,
  createActionItem,
  describeSourceReliability,
  generateRiskMatrix,
  isConfidenceLevel,
  isSourceReliability,
} from "../src";

describe("intel-standards", () => {
  it("describes every source reliability grade", () => {
    const grades: SourceReliability[] = ["A", "B", "C", "D", "E", "F"];

    grades.forEach((grade) => {
      const info = describeSourceReliability(grade);
      expect(info.level).toBe(grade);
      expect(info.description.length).toBeGreaterThan(0);
    });
  });

  it("guards source reliability values", () => {
    expect(isSourceReliability("A")).toBe(true);
    expect(isSourceReliability("g")).toBe(false);
    expect(isSourceReliability(123)).toBe(false);
  });

  it("guards confidence levels", () => {
    expect(isConfidenceLevel("high")).toBe(true);
    expect(isConfidenceLevel("moderate")).toBe(true);
    expect(isConfidenceLevel("low")).toBe(true);
    expect(isConfidenceLevel("critical")).toBe(false);
  });

  it("calculates risk scores with category bands", () => {
    const low = calculateRiskScore(1, 3);
    expect(low).toEqual({ value: 3, category: "low" });

    const moderate = calculateRiskScore(2, 4);
    expect(moderate).toEqual({ value: 8, category: "moderate" });

    const high = calculateRiskScore(3, 4);
    expect(high.category).toBe("high");
    expect(high.value).toBe(12);

    const critical = calculateRiskScore(5, 4);
    expect(critical.category).toBe("critical");
    expect(critical.value).toBe(20);
  });

  it("builds a full 5x5 risk matrix", () => {
    const matrix = generateRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const minCell = matrix[0][0];
    expect(minCell.score.value).toBe(1);
    expect(minCell.score.category).toBe("low");

    const maxCell = matrix[4][4];
    expect(maxCell.likelihood).toBe(5);
    expect(maxCell.impact).toBe(5);
    expect(maxCell.score.value).toBe(25);
    expect(maxCell.score.category).toBe("critical");
  });

  it("creates normalized action items", () => {
    const item = createActionItem({
      owner: "  Analyst 1  ",
      summary: "   Notify customer ",
      deadline: "2026-01-01T00:00:00Z",
    });

    expect(item.owner).toBe("Analyst 1");
    expect(item.summary).toBe("Notify customer");
    expect(item.deadline).toBe("2026-01-01T00:00:00.000Z");
    expect(item.status).toBe("pending");
  });

  it("throws on invalid action item input", () => {
    expect(() =>
      createActionItem({ owner: "", summary: "Task", deadline: new Date() }),
    ).toThrow(/owner is required/);

    expect(() =>
      createActionItem({ owner: "Analyst", summary: " ", deadline: new Date() }),
    ).toThrow(/summary is required/);

    expect(() =>
      createActionItem({
        owner: "Analyst",
        summary: "Task",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline must be a valid date/);
  });

  it("accepts explicit action statuses", () => {
    const item: ActionItem = createActionItem({
      owner: "Lead",
      summary: "Close incident",
      deadline: new Date("2025-01-01T00:00:00Z"),
      status: "in_progress",
    });

    expect(item.status).toBe<ActionStatus>("in_progress");
  });
});
