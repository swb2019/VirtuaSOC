import { describe, it, expect } from "vitest";
import {
  getSourceReliability,
  getConfidenceLevel,
  calculateRiskScore,
  buildRiskMatrix,
  createActionItem,
  SourceReliabilityCode,
} from "../src";

describe("intel-standards", () => {
  it("resolves source reliability metadata for valid codes", () => {
    const entry = getSourceReliability("A");
    expect(entry.code).toBe("A");
    expect(entry.label).toContain("reliable");
  });

  it("throws when source reliability code is unknown", () => {
    expect(() =>
      getSourceReliability("Z" as SourceReliabilityCode),
    ).toThrow(/Unknown source reliability/);
  });

  it("returns the correct confidence descriptor", () => {
    const descriptor = getConfidenceLevel("moderate");
    expect(descriptor.level).toBe("moderate");
    expect(descriptor.description.length).toBeGreaterThan(5);
  });

  it("throws when confidence level is invalid", () => {
    expect(() => getConfidenceLevel("invalid" as any)).toThrow(
      /Unknown confidence level/,
    );
  });

  it("calculates risk scores and qualitative bands", () => {
    const lowRisk = calculateRiskScore(1, 4);
    expect(lowRisk.score).toBe(4);
    expect(lowRisk.band).toBe("low");

    const highRisk = calculateRiskScore(4, 4);
    expect(highRisk.score).toBe(16);
    expect(highRisk.band).toBe("high");

    const criticalRisk = calculateRiskScore(5, 5);
    expect(criticalRisk.score).toBe(25);
    expect(criticalRisk.band).toBe("critical");
  });

  it("builds a 5x5 risk matrix ordered by likelihood and impact", () => {
    const matrix = buildRiskMatrix();
    expect(matrix.length).toBe(5);
    matrix.forEach((row, rowIndex) => {
      expect(row.length).toBe(5);
      row.forEach((cell, colIndex) => {
        expect(cell.likelihood).toBe(rowIndex + 1);
        expect(cell.impact).toBe(colIndex + 1);
        expect(cell.score).toBe((rowIndex + 1) * (colIndex + 1));
      });
    });
  });

  it("creates action items with validation and normalization", () => {
    const action = createActionItem({
      action: "  Draft DIS template  ",
      owner: "  ops@tenant ",
      deadline: "2025-01-15T12:00:00Z",
    });

    expect(action.action).toBe("Draft DIS template");
    expect(action.owner).toBe("ops@tenant");
    expect(action.status).toBe("pending");
    expect(action.deadline).toBe("2025-01-15T12:00:00.000Z");
  });

  it("rejects invalid action item input", () => {
    expect(() =>
      createActionItem({
        action: "",
        owner: "analyst",
        deadline: "2025-01-01",
      }),
    ).toThrow(/Action description is required/);

    expect(() =>
      createActionItem({
        action: "Collect OSINT",
        owner: "",
        deadline: "2025-01-01",
      }),
    ).toThrow(/Action owner is required/);

    expect(() =>
      createActionItem({
        action: "Collect OSINT",
        owner: "analyst",
        deadline: "invalid",
      }),
    ).toThrow(/Deadline must be a valid ISO-8601/);

    expect(() =>
      createActionItem({
        action: "Collect OSINT",
        owner: "analyst",
        deadline: "2025-01-01T00:00:00Z",
        status: "done" as any,
      }),
    ).toThrow(/Unknown action status/);
  });
});
