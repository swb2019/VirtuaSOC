import { describe, expect, it } from "vitest";
import {
  createSourceReliability,
  createConfidence,
  createRiskAssessment,
  createActionItem,
  SOURCE_RELIABILITY_SCALE,
  CONFIDENCE_SCALE,
} from "../src";

describe("intel-standards", () => {
  it("creates normalized source reliability descriptors", () => {
    const descriptor = createSourceReliability(" a ");
    expect(descriptor).toEqual({
      code: "A",
      description: SOURCE_RELIABILITY_SCALE[0].description,
    });
  });

  it("throws on invalid source reliability code", () => {
    expect(() => createSourceReliability("Z")).toThrowError();
  });

  it("creates normalized confidence descriptors", () => {
    const confidence = createConfidence("LOW");
    expect(confidence.level).toBe("low");
    expect(CONFIDENCE_SCALE.find((c) => c.level === "low")?.description).toBe(
      confidence.description,
    );
  });

  it("throws on invalid confidence level", () => {
    expect(() => createConfidence("maybe")).toThrowError();
  });

  it("computes a risk assessment with derived severity", () => {
    const assessment = createRiskAssessment({ likelihood: 4, impact: 3 });
    expect(assessment).toEqual({
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      severity: "high",
    });
  });

  it("enforces 1-5 bounds on risk matrix axes", () => {
    expect(() => createRiskAssessment({ likelihood: 0, impact: 3 })).toThrow();
    expect(() => createRiskAssessment({ likelihood: 6, impact: 1 })).toThrow();
  });

  it("creates action items with normalized ISO deadlines", () => {
    const action = createActionItem({
      owner: "  Fusion Lead  ",
      action: "Notify stakeholders",
      deadline: "2025-02-01",
    });
    expect(action.owner).toBe("Fusion Lead");
    expect(action.deadline).toMatch(/T00:00:00.000Z$/);
  });

  it("rejects invalid action items", () => {
    expect(() =>
      createActionItem({ owner: "", action: "Test", deadline: "2025" }),
    ).toThrowError();
    expect(() =>
      createActionItem({ owner: "Ops", action: "", deadline: "2025-01-01" }),
    ).toThrowError();
    expect(() =>
      createActionItem({
        owner: "Ops",
        action: "Task",
        deadline: "not-a-date",
      }),
    ).toThrowError();
  });
});
