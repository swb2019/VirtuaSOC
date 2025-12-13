import { describe, it, expect } from "vitest";
import {
  ActionItem,
  ActionItemInput,
  ConfidenceLevel,
  CONFIDENCE_LEVELS,
  createActionItem,
  deriveRiskScore,
  getSourceReliabilityDescriptor,
  isIsoDateString,
  RiskMatrix,
  RiskMatrixCell,
  RiskScore,
  RISK_MATRIX,
  SOURCE_RELIABILITY_SCALE,
  SourceReliabilityDescriptor,
  SourceReliabilityGrade,
} from "../src";

describe("intel-standards: source reliability", () => {
  it("provides descriptors for all grades", () => {
    const grades: SourceReliabilityGrade[] = ["A", "B", "C", "D", "E", "F"];
    grades.forEach((grade) => {
      const descriptor: SourceReliabilityDescriptor =
        SOURCE_RELIABILITY_SCALE[grade];
      expect(descriptor.grade).toBe(grade);
      expect(descriptor.label.length).toBeGreaterThan(0);
      expect(descriptor.description.length).toBeGreaterThan(0);
    });
  });

  it("returns canonical descriptor via helper", () => {
    const descriptor = getSourceReliabilityDescriptor("B");
    expect(descriptor).toEqual(SOURCE_RELIABILITY_SCALE.B);
  });
});

describe("intel-standards: confidence levels", () => {
  it("covers high/moderate/low with descriptions", () => {
    const levels: ConfidenceLevel[] = ["high", "moderate", "low"];
    levels.forEach((level) => {
      const descriptor = CONFIDENCE_LEVELS[level];
      expect(descriptor.level).toBe(level);
      expect(descriptor.description.length).toBeGreaterThan(10);
    });
  });
});

describe("intel-standards: risk matrix", () => {
  it("is a 5x5 grid with monotonically increasing severity", () => {
    const matrix: RiskMatrix = RISK_MATRIX;
    expect(matrix).toHaveLength(5);
    matrix.forEach((row) => expect(row).toHaveLength(5));
    expect(matrix[4][4]).toBe("high"); // 5x5 cell
    expect(matrix[0][0]).toBe("low"); // 1x1 cell
  });

  it("derives risk scores consistently", () => {
    const lowCell: RiskMatrixCell = { likelihood: 1, impact: 4 };
    const moderateCell: RiskMatrixCell = { likelihood: 3, impact: 3 };
    const highCell: RiskMatrixCell = { likelihood: 5, impact: 5 };

    const lowScore: RiskScore = deriveRiskScore(lowCell);
    const moderateScore: RiskScore = deriveRiskScore(moderateCell);
    const highScore: RiskScore = deriveRiskScore(highCell);

    expect(lowScore.value).toBe(4);
    expect(lowScore.category).toBe("low");

    expect(moderateScore.value).toBe(9);
    expect(moderateScore.category).toBe("moderate");

    expect(highScore.value).toBe(25);
    expect(highScore.category).toBe("high");
  });
});

describe("intel-standards: action items", () => {
  const baseInput: ActionItemInput = {
    description: "Publish DIS update",
    owner: "Intel Lead",
    deadline: "2025-01-15T00:00:00Z",
  };

  it("creates normalized action items with default status", () => {
    const action: ActionItem = createActionItem(baseInput);
    expect(action.description).toBe("Publish DIS update");
    expect(action.owner).toBe("Intel Lead");
    expect(action.status).toBe("planned");
    expect(isIsoDateString(action.deadline)).toBe(true);
  });

  it("rejects non-ISO deadlines", () => {
    expect(() =>
      createActionItem({ ...baseInput, deadline: "01/15/2025" }),
    ).toThrowError(/deadline must be an ISO 8601 string/i);
  });

  it("rejects blank owners or descriptions", () => {
    expect(() =>
      createActionItem({ ...baseInput, owner: "  " }),
    ).toThrowError(/owner is required/i);
    expect(() =>
      createActionItem({ ...baseInput, description: "" }),
    ).toThrowError(/description is required/i);
  });
});
