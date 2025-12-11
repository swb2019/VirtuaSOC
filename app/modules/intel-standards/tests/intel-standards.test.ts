import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_SCALE,
  buildRiskMatrix,
  computeRiskScore,
  createActionItem,
  getSourceReliabilityInfo,
  getConfidenceInfo,
  SourceReliabilityCode,
  ConfidenceLevel,
} from "../src";

describe("intel-standards", () => {
  it("exposes all source reliability codes with metadata", () => {
    const codes: SourceReliabilityCode[] = ["A", "B", "C", "D", "E", "F"];
    const descriptors = codes.map((code) => getSourceReliabilityInfo(code));

    expect(descriptors.map((d) => d.code)).toEqual(codes);
    descriptors.forEach((descriptor) => {
      expect(descriptor.label.length).toBeGreaterThan(0);
      expect(descriptor.description.length).toBeGreaterThan(0);
      expect(SOURCE_RELIABILITY_SCALE[descriptor.code]).toEqual(descriptor);
    });
  });

  it("looks up confidence descriptors", () => {
    const levels: ConfidenceLevel[] = ["high", "moderate", "low"];
    levels.forEach((level) => {
      const descriptor = getConfidenceInfo(level);
      expect(descriptor.level).toBe(level);
      expect(descriptor.description).toBe(
        CONFIDENCE_SCALE[level].description,
      );
    });
  });

  it("computes risk scores with category thresholds", () => {
    expect(computeRiskScore(1, 1)).toMatchObject({
      value: 1,
      category: "low",
    });
    expect(computeRiskScore(2, 3)).toMatchObject({
      value: 6,
      category: "moderate",
    });
    expect(computeRiskScore(3, 5)).toMatchObject({
      value: 15,
      category: "high",
    });
    expect(computeRiskScore(5, 5)).toMatchObject({
      value: 25,
      category: "critical",
    });
  });

  it("builds a 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix.length).toBe(5);
    matrix.forEach((row) => expect(row.length).toBe(5));

    expect(matrix[0][0]).toMatchObject({
      likelihood: 1,
      impact: 1,
      value: 1,
      category: "low",
    });
    expect(matrix[4][4]).toMatchObject({
      likelihood: 5,
      impact: 5,
      value: 25,
      category: "critical",
    });

    const combinations = new Set(
      matrix.flat().map((cell) => `${cell.likelihood}-${cell.impact}`),
    );
    expect(combinations.size).toBe(25);
  });

  it("creates action items with normalized ISO deadlines", () => {
    const item = createActionItem({
      action: "Notify trusted partners",
      owner: "Ops",
      deadline: "2025-02-01T00:00:00Z",
    });

    expect(item.action).toBe("Notify trusted partners");
    expect(item.owner).toBe("Ops");
    expect(item.deadline).toBe("2025-02-01T00:00:00.000Z");
    expect(item.status).toBe("pending");
  });

  it("supports Date deadlines and status overrides", () => {
    const deadline = new Date("2025-03-15T12:30:00Z");
    const item = createActionItem({
      action: "Publish DIS revision",
      owner: "Intel Lead",
      deadline,
      status: "in_progress",
    });

    expect(item.deadline).toBe(deadline.toISOString());
    expect(item.status).toBe("in_progress");
  });

  it("validates required fields for action items", () => {
    expect(() =>
      createActionItem({
        action: "  ",
        owner: "Ops",
        deadline: "2025-02-01T00:00:00Z",
      }),
    ).toThrow(/Action is required/);

    expect(() =>
      createActionItem({
        action: "Stage flash alert",
        owner: "",
        deadline: "2025-02-01T00:00:00Z",
      }),
    ).toThrow(/Owner is required/);

    expect(() =>
      createActionItem({
        action: "Stage flash alert",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/Deadline must be a valid ISO 8601 string/);
  });
});
