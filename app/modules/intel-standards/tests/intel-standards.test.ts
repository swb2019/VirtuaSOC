import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_DESCRIPTIONS,
  ACTION_ITEM_STATUS,
  describeSourceReliability,
  isConfidenceLevel,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  isActionItemOverdue,
} from "../src";

describe("intel-standards", () => {
  it("returns canonical description for each source reliability scale", () => {
    (Object.keys(SOURCE_RELIABILITY_DESCRIPTIONS) as Array<keyof typeof SOURCE_RELIABILITY_DESCRIPTIONS>).forEach(
      (scale) => {
        const description = describeSourceReliability(scale);
        expect(description).toBe(SOURCE_RELIABILITY_DESCRIPTIONS[scale]);
        expect(description.length).toBeGreaterThan(0);
      },
    );
  });

  it("validates confidence levels", () => {
    expect(isConfidenceLevel("high")).toBe(true);
    expect(isConfidenceLevel("moderate")).toBe(true);
    expect(isConfidenceLevel("low")).toBe(true);
    expect(isConfidenceLevel("unknown")).toBe(false);
  });

  it("calculates risk score and qualitative tier", () => {
    const score = calculateRiskScore(4, 4);
    expect(score).toEqual({ likelihood: 4, impact: 4, value: 16, category: "high" });
  });

  it("builds full 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row, likelihoodIndex) => {
      expect(row).toHaveLength(5);
      row.forEach((cell, impactIndex) => {
        const expectedValue = (likelihoodIndex + 1) * (impactIndex + 1);
        expect(cell.value).toBe(expectedValue);
      });
    });
  });

  it("normalizes action item deadlines and defaults status", () => {
    const targetDate = "2025-01-31T00:00:00Z";
    const action = createActionItem({
      description: "Deliver DIS update",
      owner: "Ops",
      deadline: targetDate,
    });

    expect(action.description).toBe("Deliver DIS update");
    expect(action.owner).toBe("Ops");
    expect(action.status).toBe("pending");
    expect(action.deadline).toBe(new Date(targetDate).toISOString());
  });

  it("rejects invalid action items", () => {
    expect(() =>
      createActionItem({
        description: " ",
        owner: "Ops",
        deadline: "2025-01-01",
      }),
    ).toThrow(/description/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "",
        deadline: "2025-01-01",
      }),
    ).toThrow(/owner/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/);
  });

  it("detects overdue action items", () => {
    const action = createActionItem({
      description: "Send flash alert",
      owner: "Intel",
      deadline: "2025-01-01T00:00:00.000Z",
    });

    const referenceDate = new Date("2025-02-01T00:00:00.000Z");
    expect(isActionItemOverdue(action, referenceDate)).toBe(true);

    const completedStatus = ACTION_ITEM_STATUS.Completed;
    const completed = { ...action };
    completed.status = completedStatus;
    expect(isActionItemOverdue(completed, referenceDate)).toBe(false);
  });
});
