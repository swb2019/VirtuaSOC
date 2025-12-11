import { describe, it, expect } from "vitest";
import {
  CONFIDENCE_SCALE,
  SOURCE_RELIABILITY_SCALE,
  buildRiskMatrix,
  computeRiskScore,
  createActionItem,
  isActionItemOverdue,
  ConfidenceLevel,
  SourceReliability,
} from "../src";

describe("intel-standards primitives", () => {
  it("exposes all AF source reliability descriptors", () => {
    const letters: SourceReliability[] = ["A", "B", "C", "D", "E", "F"];
    letters.forEach((letter) => {
      const descriptor = SOURCE_RELIABILITY_SCALE[letter];
      expect(descriptor.label).toBe(letter);
      expect(descriptor.description.length).toBeGreaterThan(5);
    });
  });

  it("orders confidence levels by ordinal and provides descriptions", () => {
    const order = (Object.values(CONFIDENCE_SCALE)
      .sort((a, b) => b.ordinal - a.ordinal)
      .map((d) => d.level)) as ConfidenceLevel[];

    expect(order).toEqual(["high", "moderate", "low"]);
    Object.values(CONFIDENCE_SCALE).forEach((descriptor) => {
      expect(descriptor.description.length).toBeGreaterThan(5);
    });
  });
});

describe("risk matrix", () => {
  it("computes risk score and bucket", () => {
    const result = computeRiskScore(5, 4);
    expect(result.riskScore).toBe(20);
    expect(result.bucket).toBe("critical");
  });

  it("rejects invalid likelihood or impact values", () => {
    expect(() => computeRiskScore(0 as 1, 3)).toThrow(/likelihood/);
    expect(() => computeRiskScore(3, 8 as 5)).toThrow(/impact/);
  });

  it("provides a sorted 5x5 matrix", () => {
    const matrix = buildRiskMatrix();
    expect(matrix).toHaveLength(25);
    const scores = matrix.map((cell) => cell.riskScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
    expect(matrix[0]).toMatchObject({ riskScore: 25 });
    expect(matrix[0]?.bucket).toBe("critical");
    const lastCell = matrix.at(-1);
    expect(lastCell).toMatchObject({ riskScore: 1 });
    expect(lastCell?.bucket).toBe("minimal");
  });
});

describe("action items", () => {
  it("creates normalized action items", () => {
    const item = createActionItem({
      owner: "  Analyst 1  ",
      description: "  Notify customer  ",
      deadline: "2025-01-01T00:00:00.000Z",
    });

    expect(item.owner).toBe("Analyst 1");
    expect(item.description).toBe("Notify customer");
    expect(item.deadline).toBe("2025-01-01T00:00:00.000Z");
    expect(item.completed).toBe(false);
  });

  it("normalizes shorthand ISO deadlines", () => {
    const item = createActionItem({
      owner: "Ops",
      description: "Publish Flash Alert",
      deadline: "2025-02-01",
    });

    expect(item.deadline).toBe("2025-02-01T00:00:00.000Z");
  });

  it("detects overdue status unless completed", () => {
    const overdue = createActionItem({
      owner: "Ops",
      description: "Send DIS",
      deadline: "2025-01-01T00:00:00.000Z",
    });

    const reference = new Date("2025-01-02T00:00:00.000Z");
    expect(isActionItemOverdue(overdue, reference)).toBe(true);
    expect(isActionItemOverdue({ ...overdue, completed: true }, reference)).toBe(
      false,
    );
  });

  it("throws on invalid owner or deadline", () => {
    expect(() =>
      createActionItem({
        owner: "",
        description: "",
        deadline: "2025-01-01T00:00:00.000Z",
      }),
    ).toThrow(/owner/);

    expect(() =>
      createActionItem({
        owner: "Ops",
        description: "Publish",
        deadline: "invalid",
      }),
    ).toThrow(/deadline/);
  });

  it("throws when stored deadline is malformed on overdue check", () => {
    expect(() =>
      isActionItemOverdue({
        owner: "Ops",
        description: "bad",
        deadline: "invalid",
        completed: false,
      }),
    ).toThrow(/deadline/);
  });
});
