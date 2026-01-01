import { describe, expect, it } from "vitest";

import { normalizeEntityType } from "./entities";

describe("normalizeEntityType", () => {
  it("accepts known types", () => {
    expect(normalizeEntityType("person")).toBe("PERSON");
    expect(normalizeEntityType("FACILITY")).toBe("FACILITY");
  });

  it("rejects unknown types", () => {
    expect(normalizeEntityType("bad")).toBeNull();
    expect(normalizeEntityType("")).toBeNull();
  });
});


