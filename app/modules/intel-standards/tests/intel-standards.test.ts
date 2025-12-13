import { describe, it, expect } from "vitest";
import {
  describeSourceReliability,
  describeConfidence,
  createRiskMatrixCell,
  calculateRiskScore,
  deriveRiskLevel,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("returns metadata for the AF source reliability scale", () => {
    const descriptor = describeSourceReliability("A");
    expect(descriptor.label).toContain("reliable");
    expect(descriptor.rating).toBe("A");
  });

  it("provides confidence descriptors", () => {
    const descriptor = describeConfidence("low");
    expect(descriptor.level).toBe("low");
    expect(descriptor.description).toContain("assumptions");
  });

  it("validates and freezes risk matrix cells", () => {
    const cell = createRiskMatrixCell({ likelihood: 4, impact: 5 });
    expect(cell).toEqual({ likelihood: 4, impact: 5 });
    expect(Object.isFrozen(cell)).toBe(true);

    expect(() => createRiskMatrixCell({ likelihood: 0, impact: 3 })).toThrow();
    expect(() => createRiskMatrixCell({ likelihood: 3, impact: 7 })).toThrow();
  });

  it("calculates risk score and level category", () => {
    const cell = createRiskMatrixCell({ likelihood: 5, impact: 4 });
    const score = calculateRiskScore(cell);
    expect(score).toBe(20);
    expect(deriveRiskLevel(score)).toBe("critical");

    expect(deriveRiskLevel(10)).toBe("moderate");
    expect(deriveRiskLevel(2)).toBe("low");
  });

  it("normalizes action items and enforces ISO deadlines", () => {
    const action = createActionItem({
      title: " Patch servers ",
      owner: " SOC Lead ",
      deadline: "2025-01-01T00:00:00.000Z",
    });

    expect(action).toEqual({
      title: "Patch servers",
      owner: "SOC Lead",
      deadline: "2025-01-01T00:00:00.000Z",
      status: "pending",
    });

    expect(() =>
      createActionItem({
        title: "Missing deadline",
        owner: "Team",
        deadline: "2025-01-01",
      }),
    ).toThrow(/ISO 8601/);
  });
});
