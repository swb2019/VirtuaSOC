import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_LEVELS,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  isActionItemOverdue,
} from "../src";

describe("intel-standards", () => {
  it("exposes AF reliability and confidence descriptors", () => {
    expect(Object.keys(SOURCE_RELIABILITY_SCALE)).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(SOURCE_RELIABILITY_SCALE.A.label).toContain("Completely reliable");

    expect(Object.keys(CONFIDENCE_LEVELS)).toEqual(["high", "moderate", "low"]);
    expect(CONFIDENCE_LEVELS.low.description.length).toBeGreaterThan(10);
  });

  it("calculates risk scores and builds a 5x5 matrix", () => {
    expect(calculateRiskScore(5, 4)).toBe(20);

    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row, likelihoodIndex) => {
      expect(row).toHaveLength(5);
      row.forEach((cell, impactIndex) => {
        const expectedLikelihood = (likelihoodIndex + 1) as 1 | 2 | 3 | 4 | 5;
        const expectedImpact = (impactIndex + 1) as 1 | 2 | 3 | 4 | 5;
        expect(cell.likelihood).toBe(expectedLikelihood);
        expect(cell.impact).toBe(expectedImpact);
        expect(cell.score).toBe(expectedLikelihood * expectedImpact);
      });
    });
  });

  it("creates normalized action items with defaults", () => {
    const action = createActionItem({
      description: "  Deliver flash alert  ",
      owner: "  Intel Ops  ",
      deadline: "2025-12-01",
    });

    expect(action.description).toBe("Deliver flash alert");
    expect(action.owner).toBe("Intel Ops");
    expect(action.status).toBe("pending");
    expect(new Date(action.deadline).toISOString()).toBe(action.deadline);
  });

  it("detects overdue action items relative to reference dates", () => {
    const action = createActionItem({
      description: "Send DIS",
      owner: "Analyst",
      deadline: "2025-01-15T00:00:00.000Z",
      status: "in_progress",
    });

    expect(isActionItemOverdue(action, "2025-02-01T00:00:00.000Z")).toBe(true);
    expect(isActionItemOverdue(action, "2024-12-01T00:00:00.000Z")).toBe(false);
  });

  it("rejects invalid action item payloads", () => {
    expect(() =>
      createActionItem({
        description: "",
        owner: "Analyst",
        deadline: "2025-01-15",
      }),
    ).toThrow(/non-empty description/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "",
        deadline: "2025-01-15",
      }),
    ).toThrow(/owner/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "Analyst",
        deadline: "not-a-date",
      }),
    ).toThrow(/Deadline/);
  });
});
