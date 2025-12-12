import { describe, it, expect } from "vitest";
import {
  describeSourceReliability,
  calculateRiskScore,
  generateRiskMatrix,
  createActionItem,
  updateActionItemStatus,
} from "../src";

describe("intel-standards", () => {
  it("returns canonical descriptor for a reliability level", () => {
    const detail = describeSourceReliability("A");
    expect(detail.level).toBe("A");
    expect(detail.description).toContain("reliable");
  });

  it("calculates risk score and band thresholds", () => {
    expect(calculateRiskScore(2, 2)).toMatchObject({
      score: 4,
      band: "minimal",
    });

    expect(calculateRiskScore(3, 3)).toMatchObject({
      score: 9,
      band: "low",
    });

    expect(calculateRiskScore(4, 4)).toMatchObject({
      score: 16,
      band: "moderate",
    });

    expect(calculateRiskScore(5, 4)).toMatchObject({
      score: 20,
      band: "high",
    });

    expect(calculateRiskScore(5, 5)).toMatchObject({
      score: 25,
      band: "critical",
    });
  });

  it("generates a 5x5 risk matrix with consistent scoring", () => {
    const matrix = generateRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const highestCell = matrix[4][4];
    expect(highestCell.score).toBe(25);
    expect(highestCell.band).toBe("critical");
  });

  it("creates normalized action items with ISO deadlines", () => {
    const action = createActionItem({
      action: "  Draft DIS template  ",
      owner: "   analyst@virtua.soc  ",
      deadline: new Date("2025-01-01T00:00:00.000Z"),
      notes: " deliverable v1",
      idFactory: () => "fixed",
    });

    expect(action.id).toBe("fixed");
    expect(action.action).toBe("Draft DIS template");
    expect(action.owner).toBe("analyst@virtua.soc");
    expect(action.status).toBe("pending");
    expect(action.deadline).toBe("2025-01-01T00:00:00.000Z");
    expect(action.notes).toBe("deliverable v1");
  });

  it("updates action item status without mutating original", () => {
    const base = createActionItem({
      action: "Ship intel product",
      owner: "ops",
      deadline: "2025-02-01T00:00:00.000Z",
    });
    const updated = updateActionItemStatus(base, "done");

    expect(updated.status).toBe("done");
    expect(base.status).toBe("pending");
  });

  it("rejects invalid deadlines", () => {
    expect(() =>
      createActionItem({
        action: "Review intel",
        owner: "chief",
        deadline: "not-a-date",
      }),
    ).toThrowError(/deadline/i);
  });
});
