import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  describeSourceReliability,
  compareConfidence,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  isActionItemOverdue,
} from "../src";

describe("intel-standards primitives", () => {
  it("exposes all source reliability descriptors", () => {
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toHaveLength(6);

    const descriptor = describeSourceReliability("A");
    expect(descriptor.meaning).toContain("Completely reliable");
  });

  it("orders confidence levels from low to high", () => {
    expect(compareConfidence("low", "high")).toBe(-1);
    expect(compareConfidence("high", "low")).toBe(1);
    expect(compareConfidence("moderate", "moderate")).toBe(0);
  });

  it("calculates risk scores with level thresholds", () => {
    const lowScore = calculateRiskScore(1, 5);
    expect(lowScore.likelihood).toBe(1);
    expect(lowScore.impact).toBe(5);
    expect(lowScore.value).toBe(5);
    expect(lowScore.level).toBe("low");

    const moderateScore = calculateRiskScore(3, 4);
    expect(moderateScore.likelihood).toBe(3);
    expect(moderateScore.impact).toBe(4);
    expect(moderateScore.value).toBe(12);
    expect(moderateScore.level).toBe("moderate");

    const criticalScore = calculateRiskScore(5, 4);
    expect(criticalScore.level).toBe("critical");

    expect(() => calculateRiskScore(6 as never, 2)).toThrow(/Likelihood/);
    expect(() => calculateRiskScore(3, 0 as never)).toThrow(/Impact/);
  });

  it("builds a 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    expect(matrix[0][0].value).toBe(1);
    expect(matrix[4][4].value).toBe(25);
  });

  it("normalizes action item inputs and defaults status", () => {
    const action = createActionItem({
      description: "  Patch Flash Alert template ",
      owner: "  intel team ",
      deadline: "2025-12-01T00:00:00Z",
    });

    expect(action.description).toBe("Patch Flash Alert template");
    expect(action.owner).toBe("intel team");
    expect(action.status).toBe("pending");
    expect(action.deadline).toBe(new Date("2025-12-01T00:00:00Z").toISOString());
  });

  it("detects overdue action items when not completed", () => {
    const action = createActionItem({
      description: "Finalize DIS QA",
      owner: "QA lead",
      deadline: "2025-01-01T00:00:00Z",
    });

    const reference = new Date("2025-01-15T00:00:00Z");
    expect(isActionItemOverdue(action, reference)).toBe(true);

    const completed = { ...action, status: "completed" } as const;
    expect(isActionItemOverdue(completed, reference)).toBe(false);
  });
});
