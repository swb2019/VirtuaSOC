import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  describeSourceReliability,
  confidenceFromProbability,
  computeRiskScore,
  createRiskMatrix,
  createActionItem,
  isActionItemOverdue,
  ActionItem,
  SourceReliability,
} from "../src";

describe("intel-standards", () => {
  it("exposes source reliability definitions", () => {
    expect(SOURCE_RELIABILITY_SCALE).toHaveLength(6);
    const entry = SOURCE_RELIABILITY_SCALE.find((e) => e.level === "A");
    expect(entry?.description).toContain("Completely reliable");
  });

  it("describes each reliability level and guards invalid ones", () => {
    expect(describeSourceReliability("C")).toBe("Fairly reliable");
    expect(() =>
      describeSourceReliability("Z" as unknown as SourceReliability),
    ).toThrow(/Unsupported source reliability level/);
  });

  it("maps probability to confidence levels", () => {
    expect(confidenceFromProbability(0)).toBe("low");
    expect(confidenceFromProbability(0.4)).toBe("moderate");
    expect(confidenceFromProbability(0.749)).toBe("moderate");
    expect(confidenceFromProbability(0.75)).toBe("high");
    expect(confidenceFromProbability(1)).toBe("high");
    expect(() => confidenceFromProbability(-0.1)).toThrow(/within \[0,1]/);
    expect(() => confidenceFromProbability(1.1)).toThrow(/within \[0,1]/);
  });

  it("computes risk scores and bands correctly", () => {
    const low = computeRiskScore(1, 2);
    expect(low.value).toBe(2);
    expect(low.band).toBe("low");

    const moderate = computeRiskScore(3, 3);
    expect(moderate.value).toBe(9);
    expect(moderate.band).toBe("moderate");

    const high = computeRiskScore(4, 4);
    expect(high.value).toBe(16);
    expect(high.band).toBe("high");

    const critical = computeRiskScore(5, 5);
    expect(critical.value).toBe(25);
    expect(critical.band).toBe("critical");
  });

  it("builds the canonical 5x5 risk matrix", () => {
    const matrix = createRiskMatrix();
    expect(matrix.cells).toHaveLength(25);
    expect(matrix.cells[0].score.value).toBe(1);
    expect(matrix.cells.at(-1)?.score.value).toBe(25);

    const cell = matrix.getCell(2, 4);
    expect(cell?.score.value).toBe(8);
    expect(cell?.score.band).toBe("moderate");
  });

  it("creates action items with normalized deadlines", () => {
    const item = createActionItem({
      description: "Notify leadership",
      owner: "  SOC Lead  ",
      deadline: "2025-01-01T00:00:00Z",
    });

    expect(item.owner).toBe("SOC Lead");
    expect(item.status).toBe("pending");
    expect(new Date(item.deadline).toISOString()).toBe(item.deadline);

    const itemFromDate = createActionItem({
      description: "Patch system",
      owner: "Infra",
      deadline: new Date("2025-03-10T12:00:00Z"),
      status: "in_progress",
    });

    expect(itemFromDate.status).toBe("in_progress");
    expect(() =>
      createActionItem({
        description: "",
        owner: "A",
        deadline: "2025-01-01",
      }),
    ).toThrow(/description is required/);
    expect(() =>
      createActionItem({
        description: "Task",
        owner: "",
        deadline: "2025-01-01",
      }),
    ).toThrow(/owner is required/);
    expect(() =>
      createActionItem({
        description: "Task",
        owner: "Ops",
        deadline: "not-a-date",
      }),
    ).toThrow(/Invalid deadline/);
  });

  it("detects overdue action items", () => {
    const item: ActionItem = {
      description: "Send report",
      owner: "Intel",
      deadline: "2025-01-01T00:00:00.000Z",
      status: "pending",
    };

    expect(isActionItemOverdue(item, "2024-12-31T23:59:59Z")).toBe(false);
    expect(isActionItemOverdue(item, "2025-01-02T00:00:00Z")).toBe(true);
    expect(() => isActionItemOverdue(item, "bad-date")).toThrow(
      /Invalid reference date/,
    );
  });
});
