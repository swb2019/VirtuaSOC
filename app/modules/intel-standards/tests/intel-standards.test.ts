import { describe, it, expect } from "vitest";
import {
  ActionItem,
  assessRisk,
  compareConfidence,
  ConfidenceLevel,
  describeSourceReliability,
  getRiskScore,
  isActionItemOverdue,
  RISK_MATRIX,
  SourceReliability,
  SOURCE_RELIABILITY_SCALE,
} from "../src";

describe("intel-standards", () => {
  it("exposes AF source reliability descriptors", () => {
    const grades: SourceReliability[] = ["A", "C", "F"];
    grades.forEach((grade) => {
      const descriptor = describeSourceReliability(grade);
      expect(descriptor.title.length).toBeGreaterThan(0);
      expect(descriptor.description.length).toBeGreaterThan(0);
      expect(descriptor).toEqual(SOURCE_RELIABILITY_SCALE[grade]);
    });
  });

  it("orders confidence levels from low to high", () => {
    const ordering: ConfidenceLevel[] = ["low", "moderate", "high"];
    ordering.forEach((level, index) => {
      expect(compareConfidence(level, level)).toBe(0);
      if (index > 0) {
        const previous = ordering[index - 1];
        expect(compareConfidence(level, previous)).toBeGreaterThan(0);
        expect(compareConfidence(previous, level)).toBeLessThan(0);
      }
    });
  });

  it("provides a full 5x5 risk matrix", () => {
    const likelihoodRows = Object.keys(RISK_MATRIX);
    expect(likelihoodRows).toHaveLength(5);
    likelihoodRows.forEach((likelihoodKey) => {
      const row = RISK_MATRIX[Number(likelihoodKey) as keyof typeof RISK_MATRIX];
      expect(Object.keys(row)).toHaveLength(5);
    });
  });

  it("computes numeric risk scores based on likelihood and impact", () => {
    expect(getRiskScore(1, 1)).toBe(1);
    expect(getRiskScore(3, 5)).toBe(15);
    expect(getRiskScore(5, 5)).toBe(25);
  });

  it("assesses risk category with thresholds", () => {
    expect(assessRisk(2, 3)).toMatchObject({ score: 6, category: "low" });
    expect(assessRisk(3, 4)).toMatchObject({ score: 12, category: "moderate" });
    expect(assessRisk(5, 4)).toMatchObject({ score: 20, category: "high" });
  });

  it("detects overdue action items relative to a reference date", () => {
    const reference = new Date("2025-01-01T00:00:00.000Z");
    const pastAction: ActionItem = {
      description: "Publish risk memo",
      owner: "intel",
      deadline: "2024-12-01T00:00:00.000Z",
    };
    const futureAction: ActionItem = {
      description: "Review OSINT feeds",
      owner: "analysis",
      deadline: "2025-02-01T00:00:00.000Z",
    };

    expect(isActionItemOverdue(pastAction, reference)).toBe(true);
    expect(isActionItemOverdue(futureAction, reference)).toBe(false);
    expect(
      isActionItemOverdue(
        { ...futureAction, deadline: "not-a-date" },
        reference,
      ),
    ).toBe(false);
  });
});
