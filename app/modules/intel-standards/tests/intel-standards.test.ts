import { describe, it, expect } from "vitest";
import {
  buildRiskMatrix,
  calculateRiskScore,
  classifyRisk,
  createActionItem,
  describeConfidence,
  describeSourceReliability,
  listConfidenceLevels,
  listSourceReliabilityScale,
} from "../src";

describe("intel-standards", () => {
  it("orders source reliability descriptors from A to F", () => {
    const scale = listSourceReliabilityScale();
    expect(scale).toHaveLength(6);
    expect(scale[0].code).toBe("A");
    expect(scale[scale.length - 1].code).toBe("F");

    const descriptor = describeSourceReliability("C");
    expect(descriptor.label).toContain("reliable");
    expect(descriptor.weight).toBe(3);
  });

  it("provides confidence descriptors in High/Moderate/Low order", () => {
    const confidences = listConfidenceLevels();
    expect(confidences.map((c) => c.level)).toEqual([
      "high",
      "moderate",
      "low",
    ]);

    const low = describeConfidence("low");
    expect(low.description.toLowerCase()).toContain("fragmentary");
  });

  it("builds a 5x5 risk matrix with increasing scores", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const lowest = matrix[0][0];
    const highest = matrix[4][4];
    expect(lowest.score).toBe(1);
    expect(lowest.band).toBe("low");
    expect(highest.score).toBe(25);
    expect(highest.band).toBe("critical");

    const midScore = calculateRiskScore(3, 4);
    expect(midScore).toBe(12);
    expect(classifyRisk(midScore)).toBe("high");
  });

  it("creates action items with normalized ISO deadlines", () => {
    const action = createActionItem({
      owner: "Ops",
      summary: "Patch exposed server",
      deadline: "2025-12-31T00:00:00Z",
    });

    expect(action.owner).toBe("Ops");
    expect(action.summary).toBe("Patch exposed server");
    expect(action.deadline).toBe("2025-12-31T00:00:00.000Z");
    expect(action.status).toBe("pending");
  });

  it("rejects action items missing owner or invalid deadline", () => {
    expect(() =>
      createActionItem({
        owner: " ",
        summary: "Task",
        deadline: "2025-01-01T00:00:00Z",
      }),
    ).toThrow();

    expect(() =>
      createActionItem({
        owner: "Ops",
        summary: "Task",
        deadline: "not-a-date",
      }),
    ).toThrow(/date/i);
  });
});
