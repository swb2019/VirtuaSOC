import { describe, it, expect } from "vitest";
import {
  describeSourceReliability,
  describeConfidenceLevel,
  calculateRiskScore,
  determineRiskBand,
  buildRiskMatrix,
  createActionItem,
  isActionItemOverdue,
  ActionItem,
} from "../src";

describe("intel-standards primitives", () => {
  it("returns descriptors for each source reliability code", () => {
    const descriptor = describeSourceReliability("A");
    expect(descriptor.label).toBe("Completely reliable");
    expect(descriptor.description).toContain("Proven track record");
  });

  it("throws when source reliability code is unknown", () => {
    expect(() =>
      describeSourceReliability("Z" as unknown as "A"),
    ).toThrow(/Unknown source reliability code/);
  });

  it("describes confidence levels", () => {
    const descriptor = describeConfidenceLevel("moderate");
    expect(descriptor.definition).toContain("plausible");
  });

  it("calculates risk scores and bands deterministically", () => {
    const score = calculateRiskScore(4, 5);
    expect(score).toBe(20);
    expect(determineRiskBand(score)).toBe("critical");

    const moderateScore = calculateRiskScore(2, 3);
    expect(determineRiskBand(moderateScore)).toBe("moderate");
  });

  it("builds a 5x5 risk matrix with consistent cells", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const cell = matrix[2][4]; // likelihood=3, impact=5
    expect(cell.likelihood).toBe(3);
    expect(cell.impact).toBe(5);
    expect(cell.score).toBe(15);
    expect(cell.band).toBe("high");
  });

  it("creates normalized action items", () => {
    const item = createActionItem({
      owner: "  Lead Analyst  ",
      description: "Publish risk memo",
      deadline: "2025-12-25T00:00:00Z",
    });

    expect(item.owner).toBe("Lead Analyst");
    expect(item.status).toBe("planned");
    expect(item.deadline).toBe("2025-12-25T00:00:00.000Z");
  });

  it("rejects invalid deadlines", () => {
    expect(() =>
      createActionItem({
        owner: "Ops",
        description: "Do thing",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline must be a valid ISO 8601/);
  });

  it("detects overdue action items", () => {
    const item: ActionItem = {
      owner: "Owner",
      description: "Task",
      deadline: "2024-01-01T00:00:00.000Z",
      status: "planned",
    };

    const result = isActionItemOverdue(item, new Date("2024-02-01T00:00:00.000Z"));
    expect(result).toBe(true);
  });
});
