import { describe, expect, it } from "vitest";
import {
  ActionItem,
  ActionItemStatus,
  CONFIDENCE_LEVELS,
  RISK_MATRIX,
  SOURCE_RELIABILITY_SCALE,
  RiskAxisValue,
  calculateRiskScore,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("exposes AF source reliability codes A-F with metadata", () => {
    const codes = Object.keys(SOURCE_RELIABILITY_SCALE);
    expect(codes).toEqual(["A", "B", "C", "D", "E", "F"]);

    codes.forEach((code) => {
      const entry = SOURCE_RELIABILITY_SCALE[code as keyof typeof SOURCE_RELIABILITY_SCALE];
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(entry.label.length);
    });
  });

  it("keeps confidence levels ordered high -> moderate -> low", () => {
    expect(CONFIDENCE_LEVELS).toEqual(["high", "moderate", "low"]);
  });

  it("calculates risk score bands and rejects invalid axes", () => {
    expect(calculateRiskScore(1, 4)).toMatchObject({ score: 4, band: "low" });
    expect(calculateRiskScore(3, 3)).toMatchObject({ score: 9, band: "moderate" });
    expect(calculateRiskScore(4, 3)).toMatchObject({ score: 12, band: "high" });
    expect(calculateRiskScore(5, 5)).toMatchObject({ score: 25, band: "critical" });

    expect(() =>
      calculateRiskScore(0 as unknown as RiskAxisValue, 3),
    ).toThrow(RangeError);
    expect(() =>
      calculateRiskScore(3, 7 as unknown as RiskAxisValue),
    ).toThrow(RangeError);
  });

  it("builds a 5x5 risk matrix aligned with calculateRiskScore", () => {
    expect(RISK_MATRIX).toHaveLength(5);
    RISK_MATRIX.forEach((row) => expect(row).toHaveLength(5));

    const corner = RISK_MATRIX[4][4];
    expect(corner.score).toBe(25);
    expect(corner.band).toBe("critical");
  });

  it("creates normalized action items and validates deadlines", () => {
    const action = createActionItem({
      label: "Notify stakeholders",
      owner: "Analyst Jane ",
      deadline: "2025-01-15T10:30:00Z",
    });

    expect(action).toStrictEqual<ActionItem>({
      label: "Notify stakeholders",
      owner: "Analyst Jane",
      deadline: "2025-01-15T10:30:00.000Z",
      status: "pending",
    });

    expect(() =>
      createActionItem({
        label: "Invalid deadline",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/);
  });

  it("accepts optional action item status overrides", () => {
    const status: ActionItemStatus = "in-progress";
    const action = createActionItem({
      label: "Draft response",
      owner: "Ops",
      deadline: "2025-02-01",
      status,
    });

    expect(action.status).toBe(status);
  });
});
