import { NextResponse } from "next/server";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { computeEvidenceHash } from "@/lib/evidenceHash";

export const runtime = "nodejs";

function isHttpUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!env.featureFactoryApp || !env.featureRbac || !env.featureEvidenceIngest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  }

  const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");

  const sourceUriRaw =
    (typeof body.sourceUri === "string" ? body.sourceUri : null) ??
    (typeof body.source_uri === "string" ? body.source_uri : null) ??
    null;
  const sourceUri = sourceUriRaw ? String(sourceUriRaw).trim() : null;
  if (sourceUri && !isHttpUrl(sourceUri)) {
    return NextResponse.json({ error: "sourceUri must be http(s)" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() || null : null;
  const summary = typeof body.summary === "string" ? body.summary.trim() || null : null;
  const contentText =
    typeof body.contentText === "string"
      ? body.contentText
      : typeof body.content_text === "string"
        ? body.content_text
        : null;

  const tags = Array.isArray(body.tags) ? body.tags.map(String).map((t: string) => t.trim()).filter(Boolean).slice(0, 30) : [];

  const fetchedAt = new Date();
  const hash = computeEvidenceHash({ sourceUri, title, summary, contentText });

  const existing =
    (sourceUri
      ? await tenantDb.evidenceItem.findFirst({ where: { tenantId: tenant.id, sourceUri } })
      : null) ??
    (hash ? await tenantDb.evidenceItem.findFirst({ where: { tenantId: tenant.id, contentHash: hash } }) : null);

  if (existing) {
    const updated = await tenantDb.evidenceItem.update({
      where: { id: existing.id },
      data: {
        fetchedAt,
        title: title ?? existing.title,
        summary: summary ?? existing.summary,
        contentText: contentText ?? existing.contentText,
        tags: Array.from(new Set([...(existing.tags ?? []), ...tags])),
        sourceType: "webhook",
        metadata: {
          ...(existing.metadata as any),
          lastWebhookAt: fetchedAt.toISOString(),
          lastWebhookBy: membership.userId,
        },
      },
    });
    return NextResponse.json({ ok: true, id: updated.id, inserted: false });
  }

  const created = await tenantDb.evidenceItem.create({
    data: {
      tenantId: tenant.id,
      fetchedAt,
      sourceType: "webhook",
      sourceUri,
      title,
      summary,
      contentText,
      contentHash: hash,
      tags,
      metadata: { raw: body, receivedAt: fetchedAt.toISOString(), channel: "webhook" },
      triageStatus: "new",
      handling: "internal",
    },
  });

  return NextResponse.json({ ok: true, id: created.id, inserted: true }, { status: 201 });
}


