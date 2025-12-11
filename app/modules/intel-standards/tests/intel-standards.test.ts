import { describe, it, expect } from "vitest";
import {
  SOURCE_RELIABILITY_DESCRIPTIONS,
  describeConfidenceLevel,
  describeSourceReliability,
  evaluateRiskMatrix,
  createActionItem,
  isSourceReliability,
  isConfidenceLevel,
} from "../src";

describe("intel-standards", () => {
  it("describes each source reliability code", () => {
    expect(describeSourceReliability("A")).toBe(
      SOURCE_RELIABILITY_DESCRIPTIONS.A,
    );
    expect(isSourceReliability("Z")).toBe(false);
  });

  it("supports confidence levels with helper text", () => {
    expect(describeConfidenceLevel("moderate")).toMatch(/mixed/i);
    expect(isConfidenceLevel("unknown")).toBe(false);
  });

  it("evaluates risk matrices and scores", () => {
    const assessment = evaluateRiskMatrix({ likelihood: 4, impact: 5 });
    expect(assessment.score).toBe(20);
    expect(assessment.band).toBe("critical");
  });

  it("rejects invalid risk coordinates", () => {
    expect(() => evaluateRiskMatrix({ likelihood: 6, impact: 1 })).toThrow(
      /likelihood/i,
    );
    expect(() => evaluateRiskMatrix({ likelihood: 3.4, impact: 2 })).toThrow(
      /integer/i,
    );
  });

  it("creates validated action items", () => {
    const deadline = "2030-01-01T00:00:00.000Z";
    const item = createActionItem({
      owner: "  Intel Lead  ",
      task: "Ship mitigation plan",
      deadline,
    });
    expect(item.owner).toBe("Intel Lead");
    expect(item.deadline).toBe(deadline);
  });

  it("rejects invalid action item inputs", () => {
    expect(() =>
      createActionItem({
        owner: "",
        task: "Task",
        deadline: "2030-01-01T00:00:00.000Z",
      }),
    ).toThrow(/owner/i);

    expect(() =>
      createActionItem({
        owner: "Owner",
        task: "Task",
        deadline: "soon",
      }),
    ).toThrow(/deadline/i);
  });
});
