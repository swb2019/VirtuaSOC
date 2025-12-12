import { describe, it, expect } from "vitest";
import type { LikelihoodLevel, ImpactLevel, ActionItem } from "../src";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_DESCRIPTORS,
  deriveRiskScore,
  createRiskMatrix,
  createActionItem,
  isActionItemOverdue,
} from "../src";

describe("intel-standards", () => {
  it("exposes the full AF source reliability scale", () => {
    const codes = Object.keys(SOURCE_RELIABILITY_SCALE);
    expect(codes).toHaveLength(6);
    expect(codes).toContain("A");
    expect(SOURCE_RELIABILITY_SCALE.A.label).toMatch(/reliable/i);
  });

  it("describes analytic confidence levels", () => {
    expect(CONFIDENCE_DESCRIPTORS.high.description).toMatch(/corroborated/i);
    expect(CONFIDENCE_DESCRIPTORS.low.description).toMatch(/fragmentary/i);
  });

  it("derives risk scores with correct ratings", () => {
    expect(deriveRiskScore(1, 1)).toMatchObject({ value: 1, rating: "low" });
    expect(deriveRiskScore(3, 3)).toMatchObject({ value: 9, rating: "moderate" });
    expect(deriveRiskScore(4, 3)).toMatchObject({ value: 12, rating: "high" });
    expect(deriveRiskScore(5, 5)).toMatchObject({ value: 25, rating: "critical" });
    expect(() => deriveRiskScore(0 as unknown as LikelihoodLevel, 3)).toThrow(
      RangeError,
    );
    expect(() => deriveRiskScore(3, 6 as unknown as ImpactLevel)).toThrow(
      RangeError,
    );
  });

  it("produces a 5x5 risk matrix aligned with deriveRiskScore", () => {
    const matrix = createRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));
    expect(matrix[0][0]).toEqual(deriveRiskScore(1, 1));
    expect(matrix[4][4]).toEqual(deriveRiskScore(5, 5));
  });

  it("creates normalized action items and detects overdue state", () => {
    const action = createActionItem({
      task: "Notify leadership",
      owner: "Ops",
      deadline: "2025-01-01T00:00:00.000Z",
      notes: "Escalate if unresolved.",
    });

    expect(action.status).toBe("pending");
    expect(action.deadline).toBe("2025-01-01T00:00:00.000Z");
    expect(action.notes).toBe("Escalate if unresolved.");

    const refDate = new Date("2025-02-01T00:00:00.000Z");
    expect(isActionItemOverdue(action, refDate)).toBe(true);

    const futureRef = new Date("2024-12-01T00:00:00.000Z");
    expect(isActionItemOverdue(action, futureRef)).toBe(false);
  });

  it("rejects invalid action item inputs", () => {
    expect(() =>
      createActionItem({
        task: "",
        owner: "Analyst",
        deadline: new Date(),
      }),
    ).toThrow(/task/);

    expect(() =>
      createActionItem({
        task: "Follow up",
        owner: " ",
        deadline: new Date(),
      }),
    ).toThrow(/owner/);

    expect(() =>
      createActionItem({
        task: "Follow up",
        owner: "Lead",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/);

    expect(() =>
      createActionItem({
        task: "Follow up",
        owner: "Lead",
        deadline: new Date(),
        status: "done" as ActionItem["status"],
      }),
    ).toThrow(/status/);
  });
});
