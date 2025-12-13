import { describe, expect, it } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  describeSourceReliability,
  calculateRiskScore,
  riskBandForScore,
  buildRiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("returns NATO-style descriptors for all reliability codes", () => {
    expect(SOURCE_RELIABILITY_SCALE).toHaveLength(6);
    const descriptor = describeSourceReliability("B");
    expect(descriptor.title).toContain("reliable");
    expect(descriptor.description.length).toBeGreaterThan(10);
  });

  it("calculates risk scores and maps to the correct band", () => {
    expect(calculateRiskScore(2, 3)).toBe(6);
    expect(riskBandForScore(4)).toBe("low");
    expect(riskBandForScore(7)).toBe("moderate");
    expect(riskBandForScore(12)).toBe("high");
    expect(riskBandForScore(18)).toBe("severe");
    expect(riskBandForScore(25)).toBe("critical");
  });

  it("builds a complete 5x5 risk matrix with deterministic bands", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const highestCell = matrix[4][4];
    expect(highestCell.likelihood).toBe(5);
    expect(highestCell.impact).toBe(5);
    expect(highestCell.score).toBe(25);
    expect(highestCell.band).toBe("critical");
  });

  it("creates normalized action items with default status", () => {
    const deadline = "2025-01-15T00:00:00Z";
    const item = createActionItem({
      title: "Patch exposed server",
      owner: "IR Lead",
      deadline,
    });

    expect(item.status).toBe("pending");
    expect(item.deadline).toBe(new Date(deadline).toISOString());
  });

  it("rejects invalid action item input", () => {
    expect(() =>
      createActionItem({
        title: "",
        owner: "Ops",
        deadline: "2025-01-01",
      }),
    ).toThrow(/title/);

    expect(() =>
      createActionItem({
        title: "Do thing",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/);
  });
});
