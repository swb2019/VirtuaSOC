import { describe, it, expect } from "vitest";
import {
  describeSourceReliability,
  describeConfidence,
  sourceReliabilityScale,
  confidenceScale,
  computeRiskScore,
  deriveRiskLevel,
  riskMatrix,
  getRiskCell,
  createActionItem,
} from "../src";

describe("intel-standards primitives", () => {
  it("exposes NATO-style source reliability descriptors", () => {
    const descriptor = describeSourceReliability("A");
    expect(descriptor.summary).toMatch(/reliable/i);
    expect(sourceReliabilityScale.C.guidance).toContain("corroboration");
  });

  it("describes analytic confidence cues", () => {
    const confidence = describeConfidence("moderate");
    expect(confidence.definition).toContain("gaps");
    expect(confidenceScale.low.narrativeCue).toMatch(/low confidence/i);
  });

  it("computes risk scores and levels for 5x5 matrix", () => {
    expect(computeRiskScore(5, 5)).toBe(25);
    expect(deriveRiskLevel(25)).toBe("critical");

    expect(riskMatrix).toHaveLength(5);
    riskMatrix.forEach((row) => expect(row).toHaveLength(5));

    const cell = getRiskCell(2, 3);
    expect(cell.score).toBe(6);
    expect(cell.level).toBe("low");
  });

  it("normalizes and validates action items", () => {
    const action = createActionItem({
      description: "  Patch exposed service  ",
      owner: "  IR Lead  ",
      deadline: "2025-01-31T00:00:00.000Z",
    });

    expect(action.description).toBe("Patch exposed service");
    expect(action.owner).toBe("IR Lead");
    expect(action.status).toBe("pending");
    expect(action.deadline).toBe("2025-01-31T00:00:00.000Z");
  });

  it("rejects invalid action items", () => {
    expect(() =>
      createActionItem({
        description: "",
        owner: "Analyst",
        deadline: "2025-02-01T00:00:00Z",
      }),
    ).toThrow(/description/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "",
        deadline: "invalid",
      }),
    ).toThrow();
  });
});
