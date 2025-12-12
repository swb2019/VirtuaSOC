import { describe, it, expect } from "vitest";
import {
  buildRiskMatrix,
  calculateRiskScore,
  createActionItem,
  getConfidenceLevel,
  getSourceReliability,
} from "../src";

describe("intel-standards", () => {
  it("looks up source reliability definitions", () => {
    const entry = getSourceReliability("A");
    expect(entry.label).toContain("reliable");
    expect(entry.description.length).toBeGreaterThan(10);
  });

  it("throws on unsupported source reliability grades", () => {
    expect(() => getSourceReliability("Z" as never)).toThrowError(
      /unsupported source reliability/i,
    );
  });

  it("returns confidence level descriptors", () => {
    const entry = getConfidenceLevel("moderate");
    expect(entry.description.toLowerCase()).toContain("credible");
  });

  it("throws on unsupported confidence levels", () => {
    expect(() => getConfidenceLevel("unknown" as never)).toThrowError(
      /unsupported confidence level/i,
    );
  });

  it("calculates risk score and severity boundaries", () => {
    expect(calculateRiskScore(1, 5).severity).toBe("minimal");
    expect(calculateRiskScore(2, 5).severity).toBe("low");
    expect(calculateRiskScore(3, 5).severity).toBe("moderate");
    expect(calculateRiskScore(4, 5).severity).toBe("high");
    const critical = calculateRiskScore(5, 5);
    expect(critical.score).toBe(25);
    expect(critical.severity).toBe("critical");
  });

  it("builds a complete 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const seen = new Set<string>();
    matrix.forEach((row) =>
      row.forEach((cell) =>
        seen.add(`${cell.likelihood}-${cell.impact}`),
      ),
    );
    expect(seen.size).toBe(25);
  });

  it("creates normalized action items", () => {
    const action = createActionItem({
      description: " Patch zero-day ",
      owner: " IR Team ",
      deadline: "2025-12-31T00:00:00Z",
    });
    expect(action.description).toBe("Patch zero-day");
    expect(action.owner).toBe("IR Team");
    expect(action.status).toBe("pending");
    expect(action.deadline).toBe("2025-12-31T00:00:00.000Z");
  });

  it("validates action items", () => {
    expect(() =>
      createActionItem({
        description: "",
        owner: "",
        deadline: "2024-01-01",
      }),
    ).toThrow(/description is required/);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/invalid deadline/i);
  });
});
