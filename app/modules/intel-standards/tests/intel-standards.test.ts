import { describe, it, expect } from "vitest";
import {
  getSourceReliability,
  assertConfidenceLevel,
  calculateRiskScore,
  generateRiskMatrix,
  createActionItem,
} from "../src";

describe("intel-standards", () => {
  it("returns AF-style source reliability entries", () => {
    const entry = getSourceReliability("a");
    expect(entry.code).toBe("A");
    expect(entry.label.toLowerCase()).toContain("reliable");
  });

  it("throws for unknown reliability codes", () => {
    expect(() => getSourceReliability("Z")).toThrowError(/Unknown/);
  });

  it("asserts confidence levels", () => {
    expect(() => assertConfidenceLevel("high")).not.toThrow();
    expect(() => assertConfidenceLevel("HIGH")).toThrow();
  });

  it("calculates risk scores with bands", () => {
    const risk = calculateRiskScore(3, 5);
    expect(risk.score).toBe(15);
    expect(risk.band).toBe("high");
  });

  it("rejects invalid likelihood/impact pairs", () => {
    expect(() => calculateRiskScore(0, 3)).toThrow(RangeError);
    expect(() => calculateRiskScore(2.5, 3)).toThrow(TypeError);
  });

  it("generates a full 5x5 risk matrix", () => {
    const matrix = generateRiskMatrix();
    expect(matrix.length).toBe(5);
    matrix.forEach((row) => expect(row.length).toBe(5));

    const flattened = matrix.flat();
    expect(flattened).toHaveLength(25);

    const uniqueKeys = new Set(
      flattened.map((cell) => `${cell.likelihood}-${cell.impact}`),
    );
    expect(uniqueKeys.size).toBe(25);

    const minCell = flattened.find(
      (cell) => cell.likelihood === 1 && cell.impact === 1,
    );
    expect(minCell?.score).toBe(1);
    expect(minCell?.band).toBe("low");

    const maxCell = flattened.find(
      (cell) => cell.likelihood === 5 && cell.impact === 5,
    );
    expect(maxCell?.score).toBe(25);
    expect(maxCell?.band).toBe("critical");
  });

  it("creates normalized action items", () => {
    const action = createActionItem({
      description: "  Draft DIS summary  ",
      owner: "  intel lead  ",
      deadline: "2025-01-31T00:00:00Z",
    });

    expect(action.description).toBe("Draft DIS summary");
    expect(action.owner).toBe("intel lead");
    expect(action.deadline).toBe("2025-01-31T00:00:00.000Z");
  });

  it("rejects invalid action items", () => {
    expect(() =>
      createActionItem({ description: "", owner: "a", deadline: "2025" }),
    ).toThrow();
    expect(() =>
      createActionItem({
        description: "desc",
        owner: "",
        deadline: "2025-01-31T00:00:00Z",
      }),
    ).toThrow();
    expect(() =>
      // @ts-expect-error invalid input type
      createActionItem(undefined),
    ).toThrow();
  });
});
