import { describe, expect, it } from "vitest";

import { extractIndicatorsFromText } from "./indicators.js";

describe("extractIndicatorsFromText", () => {
  it("extracts urls/domains/ips/hashes/cves/emails", () => {
    const text = `
      CVE-2024-12345
      https://example.com/path?a=1#frag
      Contact: SOC@example.com
      IOC: 8.8.8.8
      sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      Domain: sub.Example.com
    `;
    const out = extractIndicatorsFromText(text, "test");
    const kinds = new Set(out.map((x) => x.kind));
    expect(kinds.has("cve")).toBe(true);
    expect(kinds.has("url")).toBe(true);
    expect(kinds.has("email")).toBe(true);
    expect(kinds.has("ip")).toBe(true);
    expect(kinds.has("hash")).toBe(true);
    expect(kinds.has("domain")).toBe(true);

    const url = out.find((x) => x.kind === "url");
    expect(url?.normalizedValue).toBe("https://example.com/path?a=1");

    const email = out.find((x) => x.kind === "email");
    expect(email?.normalizedValue).toBe("soc@example.com");
  });

  it("dedupes by normalized form", () => {
    const text = `https://EXAMPLE.com https://example.com/`;
    const out = extractIndicatorsFromText(text, "test");
    const urls = out.filter((x) => x.kind === "url");
    expect(urls.length).toBe(1);
  });
});


