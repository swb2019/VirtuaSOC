import { describe, it, expect } from "vitest";
import {
  CONFIDENCE_SCALE,
  CONFIDENCE_LEVELS,
  SOURCE_RELIABILITY_CODES,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  getConfidence,
  getSourceReliability,
  RiskScore,
} from "../src";

describe("intel-standards", () => {
  describe("source reliability", () => {
    it("returns metadata for each code", () => {
      SOURCE_RELIABILITY_CODES.forEach((code) => {
        const meta = getSourceReliability(code);
        expect(meta.code).toBe(code);
        expect(meta.label.length).toBeGreaterThan(0);
        expect(meta.description.length).toBeGreaterThan(0);
      });
    });

    it("throws for unknown code", () => {
      expect(() => getSourceReliability("Z" as any)).toThrow(/unknown/i);
    });
  });

  describe("confidence levels", () => {
    it("mirrors exported scale", () => {
      CONFIDENCE_LEVELS.forEach((level) => {
        const meta = getConfidence(level);
        expect(meta).toEqual(CONFIDENCE_SCALE[level]);
      });
    });
  });

  describe("risk matrix", () => {
    it("calculates value and band across ranges", () => {
      expect(calculateRiskScore(1 as any, 1 as any)).toMatchObject({
        value: 1,
        band: "low",
      });
      expect(calculateRiskScore(3 as any, 3 as any)).toMatchObject({
        value: 9,
        band: "moderate",
      });
      expect(calculateRiskScore(4 as any, 4 as any)).toMatchObject({
        value: 16,
        band: "high",
      });
      expect(calculateRiskScore(5 as any, 5 as any)).toMatchObject({
        value: 25,
        band: "critical",
      });
    });

    it("rejects inputs outside 1-5", () => {
      expect(() => calculateRiskScore(0 as any, 1 as any)).toThrow(/between 1 and 5/);
      expect(() => calculateRiskScore(1 as any, 6 as any)).toThrow(/between 1 and 5/);
    });

    it("builds a full 5x5 matrix", () => {
      const matrix = buildRiskMatrix();
      expect(matrix).toHaveLength(5);
      matrix.forEach((row) => expect(row).toHaveLength(5));

      const topLeft: RiskScore = matrix[0][0];
      const bottomRight: RiskScore = matrix[4][4];
      expect(topLeft.value).toBe(1);
      expect(bottomRight.value).toBe(25);
      expect(bottomRight.band).toBe("critical");
    });
  });

  describe("action items", () => {
    it("normalizes text and deadline", () => {
      const item = createActionItem({
        summary: "  Patch VPN gateway  ",
        owner: "  SOC Ops  ",
        deadline: "2025-12-15",
      });

      expect(item.summary).toBe("Patch VPN gateway");
      expect(item.owner).toBe("SOC Ops");
      expect(item.deadline).toBe(new Date("2025-12-15").toISOString());
    });

    it("validates required fields", () => {
      expect(() =>
        createActionItem({ summary: "", owner: "Alice", deadline: "2025" }),
      ).toThrow(/summary is required/);

      expect(() =>
        createActionItem({ summary: "Task", owner: " ", deadline: "2025" }),
      ).toThrow(/owner is required/);

      expect(() =>
        createActionItem({ summary: "Task", owner: "Bob", deadline: "not a date" }),
      ).toThrow(/deadline must be a valid date/i);
    });
  });
});
