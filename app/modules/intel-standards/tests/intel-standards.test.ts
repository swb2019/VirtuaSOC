import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_SCALE,
  RiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("exposes the full A-F source reliability scale", () => {
    const codes = Object.keys(SOURCE_RELIABILITY_SCALE);
    expect(codes).toHaveLength(6);
    expect(codes).toEqual(["A", "B", "C", "D", "E", "F"]);

    expect(SOURCE_RELIABILITY_SCALE.A.label).toContain("Completely");
    expect(SOURCE_RELIABILITY_SCALE.F.description).toContain("Insufficient");
  });

  it("provides metadata for each confidence level", () => {
    expect(Object.keys(CONFIDENCE_SCALE)).toEqual(["high", "moderate", "low"]);
    expect(CONFIDENCE_SCALE.high.description.length).toBeGreaterThan(0);
  });

  it("computes risk scores and tiers deterministically", () => {
    const cell = RiskMatrix.getCell(5, 5);
    expect(cell.value).toBe(25);
    expect(cell.tier).toBe("critical");

    const moderateCell = RiskMatrix.getCell(2, 3);
    expect(moderateCell.value).toBe(6);
    expect(moderateCell.tier).toBe("low");
  });

  it("builds a complete 5x5 matrix", () => {
    const matrix = RiskMatrix.build();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));
    expect(matrix[0][0].value).toBe(1);
    expect(matrix[4][4].value).toBe(25);
  });

  it("validates likelihood and impact bounds", () => {
    expect(() => RiskMatrix.getCell(0 as 1, 3)).toThrow(/Invalid likelihood/);
    expect(() => RiskMatrix.getCell(3, 6 as 5)).toThrow(/Invalid impact/);
  });

  it("creates validated action items", () => {
    const action = createActionItem({
      summary: "Coordinate with legal",
      owner: "Case Officer",
      deadline: "2025-01-15",
    });

    expect(action.owner).toBe("Case Officer");
    expect(action.deadline).toBe("2025-01-15");
  });

  it("rejects action items without ISO deadline", () => {
    expect(() =>
      createActionItem({
        summary: "Brief leadership",
        owner: "Intel Lead",
        deadline: "15/01/2025",
      }),
    ).toThrow(/ISO 8601/);
  });
});
