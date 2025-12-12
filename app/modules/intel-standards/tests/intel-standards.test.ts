import { describe, it, expect } from "vitest";
import {
  describeSourceReliability,
  describeConfidenceLevel,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  RISK_MATRIX,
} from "../src";

describe("intel-standards primitives", () => {
  it("describes source reliability codes", () => {
    const entry = describeSourceReliability("A");
    expect(entry.code).toBe("A");
    expect(entry.label.toLowerCase()).toContain("reliable");
    expect(entry.description.length).toBeGreaterThan(0);
  });

  it("describes confidence levels", () => {
    const entry = describeConfidenceLevel("moderate");
    expect(entry.level).toBe("moderate");
    expect(entry.description).toContain("credible");
  });

  it("calculates risk score with correct band", () => {
    const score = calculateRiskScore(4, 5);
    expect(score.value).toBe(20);
    expect(score.band).toBe("high");
  });

  it("builds a 5x5 risk matrix deterministically", () => {
    const matrix = buildRiskMatrix();
    expect(matrix.length).toBe(5);
    matrix.forEach((row) => expect(row.length).toBe(5));
    expect(matrix).toMatchObject(RISK_MATRIX);
    expect(matrix[0][0].value).toBe(1);
    expect(matrix[4][4].value).toBe(25);
    expect(matrix[4][4].band).toBe("critical");
  });

  it("creates normalized action items", () => {
    const action = createActionItem({
      summary: "  Draft mitigation plan ",
      owner: "  Intel Lead ",
      deadline: "2025-01-15",
    });

    expect(action.summary).toBe("Draft mitigation plan");
    expect(action.owner).toBe("Intel Lead");
    expect(action.status).toBe("pending");
    expect(() => new Date(action.deadline)).not.toThrow();
  });

  it("rejects invalid deadlines", () => {
    expect(() =>
      createActionItem({
        summary: "Bad deadline",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/i);
  });
});
