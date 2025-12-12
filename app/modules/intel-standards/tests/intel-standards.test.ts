import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_ORDER,
  RISK_MATRIX,
  SOURCE_RELIABILITY_SCALE,
  computeRiskScore,
  confidenceRank,
  createActionItem,
  describeSourceReliability,
} from "../src";

describe("intel-standards", () => {
  it("provides descriptors for every source reliability code", () => {
    const codes = Object.keys(SOURCE_RELIABILITY_SCALE);
    expect(codes).toEqual(["A", "B", "C", "D", "E", "F"]);

    codes.forEach((code) => {
      const descriptor = describeSourceReliability(code as keyof typeof SOURCE_RELIABILITY_SCALE);
      expect(descriptor.code).toBe(code);
      expect(descriptor.label.length).toBeGreaterThan(0);
      expect(descriptor.description.length).toBeGreaterThan(0);
    });
  });

  it("orders confidence levels from highest to lowest certainty", () => {
    expect(CONFIDENCE_ORDER).toEqual(["high", "moderate", "low"]);
    expect(confidenceRank("high")).toBeLessThan(confidenceRank("moderate"));
    expect(confidenceRank("moderate")).toBeLessThan(confidenceRank("low"));
  });

  it("computes risk scores via the 5x5 matrix", () => {
    expect(RISK_MATRIX).toHaveLength(5);
    RISK_MATRIX.forEach((row) => expect(row).toHaveLength(5));

    expect(computeRiskScore(1, 1)).toMatchObject({
      value: 1,
      level: "minimal",
    });
    expect(computeRiskScore(3, 2)).toMatchObject({
      value: 6,
      level: "low",
    });
    expect(computeRiskScore(4, 4)).toMatchObject({
      value: 16,
      level: "high",
    });
    expect(computeRiskScore(5, 5)).toMatchObject({
      value: 25,
      level: "critical",
    });
  });

  it("creates action items with normalized fields", () => {
    const item = createActionItem({
      action: "  Coordinate Flash Alert recipients ",
      owner: "  Intel Lead ",
      deadline: "2025-01-01T00:00:00Z",
    });

    expect(item.action).toBe("Coordinate Flash Alert recipients");
    expect(item.owner).toBe("Intel Lead");
    expect(item.deadline).toBe("2025-01-01T00:00:00.000Z");
  });

  it("rejects invalid action items", () => {
    expect(() =>
      createActionItem({
        action: "",
        owner: "Owner",
        deadline: "2025-01-01T00:00:00Z",
      }),
    ).toThrow(/Action description/);

    expect(() =>
      createActionItem({
        action: "Act",
        owner: "",
        deadline: "2025-01-01T00:00:00Z",
      }),
    ).toThrow(/Owner/);

    expect(() =>
      createActionItem({
        action: "Act",
        owner: "Owner",
        deadline: "invalid-date",
      }),
    ).toThrow(/Deadline/);
  });
});

