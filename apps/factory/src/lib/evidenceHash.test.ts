import { describe, expect, it } from "vitest";

import { computeEvidenceHash } from "./evidenceHash";

describe("computeEvidenceHash", () => {
  it("is stable across whitespace differences", () => {
    const a = computeEvidenceHash({
      sourceUri: " https://example.com/x ",
      title: "Hello   world",
      summary: "line1\nline2",
      contentText: "  some   text  ",
    });
    const b = computeEvidenceHash({
      sourceUri: "https://example.com/x",
      title: "Hello world",
      summary: "line1 line2",
      contentText: "some text",
    });
    expect(a).toBe(b);
  });

  it("returns a sha256 hex string", () => {
    const h = computeEvidenceHash({ title: "x" });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});


