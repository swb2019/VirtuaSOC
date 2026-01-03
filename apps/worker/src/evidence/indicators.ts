export type IndicatorKind = "url" | "domain" | "ip" | "email" | "hash" | "cve";

export type ExtractedIndicator = {
  kind: IndicatorKind;
  value: string;
  normalizedValue: string;
  source: string;
};

function trimPunctuation(s: string): string {
  return s.replace(/^[\s"'“”‘’()<>\[\]{}.,;:]+|[\s"'“”‘’()<>\[\]{}.,;:]+$/g, "");
}

function normalizeUrl(raw: string): string | null {
  const trimmed = trimPunctuation(raw);
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const u = new URL(trimmed);
    u.hash = "";
    // Normalize hostname casing; keep path/query intact.
    u.hostname = u.hostname.toLowerCase();
    return u.toString();
  } catch {
    return null;
  }
}

function normalizeDomain(raw: string): string | null {
  const trimmed = trimPunctuation(raw).toLowerCase();
  if (!trimmed) return null;
  // Basic domain heuristic.
  if (!/^(?:[a-z0-9-]+\.)+[a-z]{2,24}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeEmail(raw: string): string | null {
  const trimmed = trimPunctuation(raw).toLowerCase();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeIp(raw: string): string | null {
  const trimmed = trimPunctuation(raw);
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(trimmed)) return null;
  const parts = trimmed.split(".").map((x) => Number(x));
  if (parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
  return parts.join(".");
}

function normalizeHash(raw: string): string | null {
  const trimmed = trimPunctuation(raw).toLowerCase();
  if (!/^[0-9a-f]{32}$|^[0-9a-f]{40}$|^[0-9a-f]{64}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeCve(raw: string): string | null {
  const trimmed = trimPunctuation(raw).toUpperCase();
  if (!/^CVE-\d{4}-\d{4,7}$/.test(trimmed)) return null;
  return trimmed;
}

export function extractIndicatorsFromText(text: string, source: string): ExtractedIndicator[] {
  const out: ExtractedIndicator[] = [];
  const seen = new Set<string>();
  const add = (kind: IndicatorKind, value: string, normalizedValue: string) => {
    const key = `${kind}:${normalizedValue}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ kind, value, normalizedValue, source });
  };

  const s = String(text ?? "");
  if (!s.trim()) return out;

  // URLs first (so domains extracted from URLs can be added separately later if desired).
  for (const m of s.matchAll(/\bhttps?:\/\/[^\s<>"')\]]+/gi)) {
    const raw = String(m[0] ?? "");
    const norm = normalizeUrl(raw);
    if (norm) add("url", raw, norm);
  }

  for (const m of s.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}\b/gi)) {
    const raw = String(m[0] ?? "");
    const norm = normalizeEmail(raw);
    if (norm) add("email", raw, norm);
  }

  // CVEs
  for (const m of s.matchAll(/\bCVE-\d{4}-\d{4,7}\b/gi)) {
    const raw = String(m[0] ?? "");
    const norm = normalizeCve(raw);
    if (norm) add("cve", raw, norm);
  }

  // Hashes (md5/sha1/sha256)
  for (const m of s.matchAll(/\b[0-9a-fA-F]{32}\b|\b[0-9a-fA-F]{40}\b|\b[0-9a-fA-F]{64}\b/g)) {
    const raw = String(m[0] ?? "");
    const norm = normalizeHash(raw);
    if (norm) add("hash", raw, norm);
  }

  // IPv4
  for (const m of s.matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g)) {
    const raw = String(m[0] ?? "");
    const norm = normalizeIp(raw);
    if (norm) add("ip", raw, norm);
  }

  // Domains (avoid matching inside URLs by using a conservative heuristic)
  for (const m of s.matchAll(/\b(?:[a-z0-9-]+\.)+[a-z]{2,24}\b/gi)) {
    const raw = String(m[0] ?? "");
    const norm = normalizeDomain(raw);
    if (norm) add("domain", raw, norm);
  }

  // Also derive domains from URLs (more reliable than free-text domains).
  for (const row of out.filter((x) => x.kind === "url")) {
    const normUrl = row.normalizedValue;
    try {
      const u = new URL(normUrl);
      const host = u.hostname.toLowerCase();
      const norm = normalizeDomain(host);
      if (norm) add("domain", host, norm);
    } catch {
      // ignore
    }
  }

  return out;
}


