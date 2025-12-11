import { describe, it, expect } from "vitest";
import {
  listSourceReliabilityScale,
  getSourceReliability,
  getConfidenceDescriptor,
  calculateRiskScore,
  deriveRiskSeverity,
  createRiskCell,
  buildRiskMatrix,
  createActionItem,
  ActionItem,
} from "../src";

describe("intel-standards", () => {
  it("exposes the ordered source reliability scale", () => {
    const scale = listSourceReliabilityScale();
    expect(scale).toHaveLength(6);
    expect(scale[0]).toMatchObject({ code: "A" });
    expect(scale.at(-1)).toMatchObject({ code: "F" });

    const entry = getSourceReliability("C");
    expect(entry.code).toBe("C");
    expect(entry.description.length).toBeGreaterThan(0);
  });

  it("returns descriptors for confidence levels", () => {
    const descriptor = getConfidenceDescriptor("moderate");
    expect(descriptor.level).toBe("moderate");
    expect(descriptor.description).toContain("plausible");
  });

  it("derives scores and severities for risk cells", () => {
    expect(calculateRiskScore(5, 5)).toBe(25);
    expect(deriveRiskSeverity(5)).toBe("low");
    expect(deriveRiskSeverity(6)).toBe("moderate");
    expect(deriveRiskSeverity(12)).toBe("moderate");
    expect(deriveRiskSeverity(13)).toBe("high");
    expect(deriveRiskSeverity(19)).toBe("high");
    expect(deriveRiskSeverity(20)).toBe("critical");

    const cell = createRiskCell(3, 4);
    expect(cell.score).toBe(12);
    expect(cell.severity).toBe("moderate");
  });

  it("builds a complete 5x5 risk matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const combos = new Set<string>();
    matrix.flat().forEach((cell) => {
      combos.add(`${cell.likelihood}-${cell.impact}`);
    });
    expect(combos.size).toBe(25);
  });

  it("creates valid action items with trimming and defaults", () => {
    const action: ActionItem = createActionItem({
      action: "Deliver DIS draft",
      owner: "  analyst.one ",
      deadline: "2030-01-01T00:00:00Z",
      notes: "  coordinate with ops ",
    });

    expect(action.owner).toBe("analyst.one");
    expect(action.status).toBe("pending");
    expect(action.notes).toBe("coordinate with ops");
  });

  it("validates action items", () => {
    expect(() =>
      createActionItem({
        action: "",
        owner: "a",
        deadline: "2030-01-01T00:00:00Z",
      }),
    ).toThrow(/action/);

    expect(() =>
      createActionItem({
        action: "Task",
        owner: "Owner",
        deadline: "invalid-date",
      }),
    ).toThrow(/ISO-8601/);
  });
});
