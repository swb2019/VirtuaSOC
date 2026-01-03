import { createHash, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";

import type { Db } from "../db.js";
import { extractIndicatorsFromText } from "./indicators.js";

export type EnrichEvidenceJobPayload = {
  tenantId: string;
  evidenceId: string;
  actorUserId?: string | null;
  force?: boolean;
};

type EvidenceRow = {
  id: string;
  tenant_id: string;
  fetched_at: string;
  source_uri: string | null;
  title: string | null;
  summary: string | null;
  content_text: string | null;
  metadata: any;
};

function nowIso() {
  return new Date().toISOString();
}

function stripNulls(s: string): string {
  return s.replace(/\u0000/g, "");
}

function stripUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, "[REDACTED_URL]");
}

function sanitizeForLlm(text: string, maxLen = 1200): string {
  // Treat all ingested text as hostile (prompt injection defense): remove URLs and cap length.
  return stripNulls(stripUrls(text)).trim().slice(0, maxLen);
}

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isPrivateIpv4(ip: string): boolean {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([a, b].some((n) => !Number.isFinite(n))) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!h) return true;
  if (h === "localhost") return true;
  if (h.endsWith(".local")) return true;
  return false;
}

async function isSafeFetchTarget(url: URL): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, reason: "unsupported_scheme" };
  const hostname = url.hostname;
  if (isLocalHostname(hostname)) return { ok: false, reason: "local_hostname" };

  // If hostname is an IPv4 literal, block private ranges.
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    if (isPrivateIpv4(hostname)) return { ok: false, reason: "private_ip" };
    return { ok: true };
  }

  // Block IPv6 literals (conservative).
  if (hostname.includes(":")) return { ok: false, reason: "ipv6_literal_blocked" };

  // DNS resolve and block private IPv4 ranges.
  try {
    const addrs = await lookup(hostname, { all: true, verbatim: true });
    for (const a of addrs) {
      if (a.family === 4 && isPrivateIpv4(a.address)) return { ok: false, reason: "dns_private_ip" };
      if (a.family === 6) return { ok: false, reason: "dns_ipv6_blocked" };
    }
  } catch {
    return { ok: false, reason: "dns_lookup_failed" };
  }

  return { ok: true };
}

function htmlToText(html: string): string {
  const s = String(html ?? "");
  // Remove script/style blocks first.
  const noScripts = s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  // Strip tags.
  const noTags = noScripts.replace(/<\/?[^>]+>/g, " ");
  // Collapse whitespace.
  return noTags.replace(/\s+/g, " ").trim();
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readResponseBytesLimited(res: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    total += value.byteLength;
    if (total >= maxBytes) break;
  }
  // Concatenate
  const out = new Uint8Array(Math.min(total, maxBytes));
  let off = 0;
  for (const c of chunks) {
    const n = Math.min(c.byteLength, out.length - off);
    if (n <= 0) break;
    out.set(c.subarray(0, n), off);
    off += n;
  }
  return out;
}

async function fetchWithRedirects(
  inputUrl: string,
  opts: { timeoutMs: number; maxRedirects: number; maxBytes: number },
): Promise<
  | {
      ok: true;
      url: string;
      finalUrl: string;
      status: number;
      contentType: string | null;
      contentLength: number | null;
      sha256: string;
      bodyText: string;
      extractedTitle: string | null;
    }
  | { ok: false; url: string; finalUrl: string | null; status: number | null; error: string }
> {
  let current = inputUrl;
  let redirects = 0;
  while (true) {
    const u = new URL(current);
    const safe = await isSafeFetchTarget(u);
    if (!safe.ok) {
      return { ok: false, url: inputUrl, finalUrl: current, status: null, error: `blocked:${safe.reason}` };
    }

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), opts.timeoutMs);
    try {
      const res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: ac.signal,
        headers: {
          "user-agent": "VirtuaSOC/1.0 (EvidenceEnrichment)",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      const status = res.status;
      const location = res.headers.get("location");
      if (status >= 300 && status < 400 && location && redirects < opts.maxRedirects) {
        redirects++;
        const next = new URL(location, current).toString();
        current = next;
        continue;
      }

      const ct = res.headers.get("content-type");
      const clRaw = res.headers.get("content-length");
      const cl = clRaw ? Number(clRaw) : null;

      const bytes = await readResponseBytesLimited(res, opts.maxBytes);
      const sha = sha256Hex(bytes);
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      const bodyText = ct?.toLowerCase().includes("text/html") ? htmlToText(text) : text;

      let extractedTitle: string | null = null;
      if (ct?.toLowerCase().includes("text/html")) {
        const m = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (m && m[1]) extractedTitle = htmlToText(m[1]).slice(0, 200) || null;
      }

      return {
        ok: true,
        url: inputUrl,
        finalUrl: current,
        status,
        contentType: ct,
        contentLength: Number.isFinite(cl as any) ? (cl as number) : null,
        sha256: sha,
        bodyText,
        extractedTitle,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, url: inputUrl, finalUrl: current, status: null, error: msg };
    } finally {
      clearTimeout(t);
    }
  }
}

export async function enrichEvidence(tenantDb: Db, payload: EnrichEvidenceJobPayload): Promise<void> {
  const tenantId = String(payload.tenantId ?? "").trim();
  const evidenceId = String(payload.evidenceId ?? "").trim();
  if (!tenantId || !evidenceId) return;

  const rows = await tenantDb<EvidenceRow[]>`
    SELECT id, tenant_id, fetched_at, source_uri, title, summary, content_text, metadata
    FROM evidence_items
    WHERE tenant_id = ${tenantId} AND id = ${evidenceId}
  `;
  if (!rows.length) return;
  const e = rows[0]!;

  const meta = (e.metadata ?? {}) as any;
  const prevEnrichment = meta?.enrichment ?? {};
  const lastRunAt = String(prevEnrichment?.lastRunAt ?? "");
  const force = Boolean(payload.force);

  // Avoid re-enrichment too frequently unless forced.
  if (!force && lastRunAt) {
    const last = Date.parse(lastRunAt);
    if (Number.isFinite(last) && Date.now() - last < 10 * 60 * 1000) {
      return;
    }
  }

  const enrichment: any = {
    lastRunAt: nowIso(),
    version: 1,
  };

  let snapshotText = "";
  let fetchResult:
    | Awaited<ReturnType<typeof fetchWithRedirects>>
    | null = null;

  if (e.source_uri && isHttpUrl(e.source_uri)) {
    fetchResult = await fetchWithRedirects(e.source_uri, { timeoutMs: 12_000, maxRedirects: 5, maxBytes: 1_000_000 });
    if (fetchResult.ok) {
      snapshotText = fetchResult.bodyText.slice(0, 20_000);
      enrichment.fetch = {
        ok: true,
        url: fetchResult.url,
        finalUrl: fetchResult.finalUrl,
        status: fetchResult.status,
        contentType: fetchResult.contentType,
        contentLength: fetchResult.contentLength,
        sha256: fetchResult.sha256,
        fetchedAt: nowIso(),
      };
      if (fetchResult.extractedTitle) enrichment.extractedTitle = fetchResult.extractedTitle;
    } else {
      enrichment.fetch = {
        ok: false,
        url: fetchResult.url,
        finalUrl: fetchResult.finalUrl,
        status: fetchResult.status,
        error: fetchResult.error,
        fetchedAt: nowIso(),
      };
    }
  }

  // IOC extraction corpus
  const corpus: { text: string; source: string }[] = [];
  if (e.source_uri) corpus.push({ text: e.source_uri, source: "source_uri" });
  if (e.title) corpus.push({ text: e.title, source: "title" });
  if (e.summary) corpus.push({ text: e.summary, source: "summary" });
  if (e.content_text) corpus.push({ text: e.content_text, source: "content_text" });
  if (snapshotText) corpus.push({ text: snapshotText, source: "snapshot" });

  const indicators = corpus.flatMap((c) => extractIndicatorsFromText(c.text, c.source));

  const llmExcerptSource = [e.title, e.summary, e.content_text, snapshotText].filter(Boolean).join("\n\n");
  enrichment.llmExcerpt = sanitizeForLlm(llmExcerptSource, 1200);
  enrichment.snapshotExcerpt = sanitizeForLlm(snapshotText, 2000);
  enrichment.indicators = {
    total: indicators.length,
    byKind: indicators.reduce<Record<string, number>>((acc, x) => {
      acc[x.kind] = (acc[x.kind] ?? 0) + 1;
      return acc;
    }, {}),
  };

  // Persist: overwrite the enrichment field (top-level merge).
  await tenantDb`
    UPDATE evidence_items
    SET metadata = COALESCE(metadata, '{}'::jsonb) || ${tenantDb.json({ enrichment })}
    WHERE tenant_id = ${tenantId} AND id = ${evidenceId}
  `;

  // Replace indicators for this evidence (keeps DB clean on re-enrich).
  await tenantDb`
    DELETE FROM evidence_indicators
    WHERE tenant_id = ${tenantId} AND evidence_id = ${evidenceId}
  `;

  if (indicators.length) {
    const rowsToInsert = indicators.map((x) => ({
      id: randomUUID(),
      tenant_id: tenantId,
      evidence_id: evidenceId,
      kind: x.kind,
      value: x.value,
      normalized_value: x.normalizedValue,
      source: x.source,
      metadata: {},
    }));

    await tenantDb`
      INSERT INTO evidence_indicators ${tenantDb(
        rowsToInsert,
        "id",
        "tenant_id",
        "evidence_id",
        "kind",
        "value",
        "normalized_value",
        "source",
        "metadata",
      )}
      ON CONFLICT DO NOTHING
    `;
  }

  // Audit log (best effort)
  try {
    await tenantDb`
      INSERT INTO audit_log (id, tenant_id, action, actor_user_id, target_type, target_id, metadata)
      VALUES (
        ${randomUUID()},
        ${tenantId},
        ${"evidence.enriched"},
        ${payload.actorUserId ?? null},
        ${"evidence"},
        ${evidenceId},
        ${tenantDb.json({
          indicators: enrichment.indicators,
          fetch: enrichment.fetch ?? null,
        })}
      )
    `;
  } catch {
    // ignore audit failures
  }
}


