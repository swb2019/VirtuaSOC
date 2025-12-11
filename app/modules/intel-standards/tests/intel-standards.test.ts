import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_DESCRIPTORS,
  createRiskMatrix,
  deriveRiskScore,
  createActionItem,
  ActionItem,
} from "../src";

describe("intel-standards", () => {
  it("enumerates all AF source reliability codes", () => {
    const codes = Object.keys(SOURCE_RELIABILITY_SCALE);
    expect(codes).toEqual(["A", "B", "C", "D", "E", "F"]);

    codes.forEach((code) => {
      const descriptor = SOURCE_RELIABILITY_SCALE[code as keyof typeof SOURCE_RELIABILITY_SCALE];
      expect(descriptor.label.length).toBeGreaterThan(0);
      expect(descriptor.description.length).toBeGreaterThan(10);
    });
  });

  it("aligns confidence descriptors with ICD-203 language", () => {
    expect(Object.keys(CONFIDENCE_DESCRIPTORS)).toEqual([
      "high",
      "moderate",
      "low",
    ]);

    expect(CONFIDENCE_DESCRIPTORS.high.description.toLowerCase()).toContain(
      "strong",
    );
  });

  it("builds a 5x5 risk matrix with derived scores", () => {
    const matrix = createRiskMatrix();
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));

    const bottomRight = matrix[4][4];
    expect(bottomRight.likelihood).toBe(5);
    expect(bottomRight.impact).toBe(5);
    expect(bottomRight.score).toBe(25);

    const topLeft = matrix[0][0];
    expect(topLeft.score).toBe(1);
  });

  it("validates likelihood/impact bounds when deriving risk score", () => {
    expect(deriveRiskScore(3, 4)).toBe(12);
    expect(() =>
      deriveRiskScore(
        6 as unknown as Parameters<typeof deriveRiskScore>[0],
        2 as unknown as Parameters<typeof deriveRiskScore>[1],
      ),
    ).toThrow(/likelihood/i);
  });

  it("normalizes action items and freezes output", () => {
    const deadline = "2025-12-01T00:00:00Z";
    const item = createActionItem({
      description: "  Patch OSINT feed  ",
      owner: "  A. Analyst ",
      deadline,
    });

    expect(item.description).toBe("Patch OSINT feed");
    expect(item.owner).toBe("A. Analyst");
    expect(item.deadline).toBe(new Date(deadline).toISOString());
    expect(item.status).toBe("pending");
    expect(Object.isFrozen(item)).toBe(true);
  });

  it("rejects missing owner or invalid deadlines", () => {
    const valid: ActionItem = createActionItem({
      description: "Review data-sharing MOU",
      owner: "SOC Lead",
      deadline: new Date("2025-01-15T09:00:00Z"),
      status: "in-progress",
    });
    expect(valid.status).toBe("in-progress");

    expect(() =>
      createActionItem({
        description: "",
        owner: "SOC Lead",
        deadline: new Date(),
      }),
    ).toThrow(/description/i);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "",
        deadline: new Date(),
      }),
    ).toThrow(/owner/i);

    expect(() =>
      createActionItem({
        description: "Task",
        owner: "Lead",
        deadline: "not-a-date",
      }),
    ).toThrow(/deadline/i);
  });
});
