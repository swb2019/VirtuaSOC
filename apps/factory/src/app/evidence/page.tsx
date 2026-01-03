import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { computeEvidenceHash } from "@/lib/evidenceHash";
import { getIngestQueue, JOB_EVIDENCE_ENRICH, JOB_SIGNALS_EVALUATE } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isHttpUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function EvidencePage() {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureEvidenceIngest) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Evidence</div>
          <div className="mt-2 text-sm text-zinc-400">M2 (Evidence ingest) is not enabled yet.</div>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-4 text-xs text-zinc-300">
            Set <code className="text-zinc-200">FEATURE_EVIDENCE_INGEST=true</code> to enable.
          </div>
        </div>
      </div>
    );
  }

  const { tenant, tenantDb, membership } = await requireTenantDb("VIEWER");

  const items = await tenantDb.evidenceItem.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const evidenceIds = items.map((e) => e.id);
  const indicatorCounts = evidenceIds.length
    ? await tenantDb.evidenceIndicator.groupBy({
        by: ["evidenceId"],
        where: { tenantId: tenant.id, evidenceId: { in: evidenceIds } },
        _count: { _all: true },
      })
    : [];
  const countByEvidenceId = new Map<string, number>(
    indicatorCounts.map((r) => [r.evidenceId, r._count._all]),
  );

  const feeds = await tenantDb.rssFeed.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  async function createManual(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");

    const sourceUriRaw = String(formData.get("sourceUri") ?? "").trim();
    const sourceUri = sourceUriRaw ? sourceUriRaw : null;
    if (sourceUri && !isHttpUrl(sourceUri)) throw new Error("sourceUri must be http(s)");

    const title = String(formData.get("title") ?? "").trim() || null;
    const summary = String(formData.get("summary") ?? "").trim() || null;
    const contentText = String(formData.get("contentText") ?? "").trim() || null;

    const tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 30);

    if (!title && !summary && !contentText) throw new Error("Provide at least one of title/summary/content");

    const hash = computeEvidenceHash({ sourceUri, title, summary, contentText });
    const fetchedAt = new Date();

    // Dedupe: prefer URL match, then hash match.
    const existing =
      (sourceUri
        ? await tenantDb.evidenceItem.findFirst({ where: { tenantId: tenant.id, sourceUri } })
        : null) ??
      (hash
        ? await tenantDb.evidenceItem.findFirst({ where: { tenantId: tenant.id, contentHash: hash } })
        : null);

    if (existing) {
      const updated = await tenantDb.evidenceItem.update({
        where: { id: existing.id },
        data: {
          fetchedAt,
          title: title ?? existing.title,
          summary: summary ?? existing.summary,
          contentText: contentText ?? existing.contentText,
          tags: Array.from(new Set([...(existing.tags ?? []), ...tags])),
          sourceType: "manual",
        },
      });
      await tenantDb.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: "evidence.updated.manual",
          actorUserId: membership.userId,
          targetType: "evidence",
          targetId: updated.id,
          metadata: {
            sourceUri,
            mergedTagsCount: updated.tags?.length ?? 0,
          },
        },
      });
      // Trigger signal evaluation (idempotent on the worker side).
      await getIngestQueue().add(
        JOB_SIGNALS_EVALUATE,
        { tenantId: tenant.id, evidenceId: existing.id },
        { jobId: `sig:${tenant.id}:${existing.id}`, removeOnComplete: 1000, removeOnFail: 1000 },
      );
      // Trigger enrichment (idempotent on the worker side).
      await getIngestQueue().add(
        JOB_EVIDENCE_ENRICH,
        { tenantId: tenant.id, evidenceId: existing.id, actorUserId: membership.userId },
        { jobId: `enrich:${tenant.id}:${existing.id}`, removeOnComplete: 1000, removeOnFail: 1000 },
      );
      redirect("/evidence");
    }

    const created = await tenantDb.evidenceItem.create({
      data: {
        tenantId: tenant.id,
        fetchedAt,
        sourceType: "manual",
        sourceUri,
        title,
        summary,
        contentText,
        contentHash: hash,
        tags,
        metadata: { createdBy: membership.userId, channel: "manual" },
        triageStatus: "new",
        handling: "internal",
      },
    });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "evidence.created.manual",
        actorUserId: membership.userId,
        targetType: "evidence",
        targetId: created.id,
        metadata: {
          sourceUri,
          tagsCount: tags.length,
        },
      },
    });

    await getIngestQueue().add(
      JOB_SIGNALS_EVALUATE,
      { tenantId: tenant.id, evidenceId: created.id },
      { jobId: `sig:${tenant.id}:${created.id}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    await getIngestQueue().add(
      JOB_EVIDENCE_ENRICH,
      { tenantId: tenant.id, evidenceId: created.id, actorUserId: membership.userId },
      { jobId: `enrich:${tenant.id}:${created.id}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );

    redirect("/evidence");
  }

  async function enqueueEnrich(formData: FormData) {
    "use server";
    const { tenant, membership } = await requireTenantDb("ANALYST");
    const evidenceId = String(formData.get("evidenceId") ?? "").trim();
    if (!evidenceId) throw new Error("evidenceId is required");
    await getIngestQueue().add(
      JOB_EVIDENCE_ENRICH,
      { tenantId: tenant.id, evidenceId, actorUserId: membership.userId },
      { jobId: `enrich:${tenant.id}:${evidenceId}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    redirect("/evidence");
  }

  async function upsertRssFeed(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const url = String(formData.get("url") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim() || null;
    if (!url) throw new Error("url is required");
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("url must be http(s)");
    } catch {
      throw new Error("url must be http(s)");
    }

    const feed = await tenantDb.rssFeed.upsert({
      where: { tenantId_url: { tenantId: tenant.id, url } },
      create: { tenantId: tenant.id, url, title, enabled: true },
      update: { title, enabled: true },
    });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "rss_feed.upsert",
        actorUserId: membership.userId,
        targetType: "rss_feed",
        targetId: feed.id,
        metadata: { url, title, enabled: true },
      },
    });

    redirect("/evidence");
  }

  async function toggleRssFeed(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const id = String(formData.get("id") ?? "").trim();
    const enabledRaw = String(formData.get("enabled") ?? "").trim().toLowerCase();
    const enabled = enabledRaw === "true";
    if (!id) throw new Error("id is required");
    const feed = await tenantDb.rssFeed.update({ where: { id }, data: { enabled } });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "rss_feed.toggled",
        actorUserId: membership.userId,
        targetType: "rss_feed",
        targetId: feed.id,
        metadata: { enabled },
      },
    });
    redirect("/evidence");
  }

  async function deleteRssFeed(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("id is required");
    const feed = await tenantDb.rssFeed.delete({ where: { id } });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "rss_feed.deleted",
        actorUserId: membership.userId,
        targetType: "rss_feed",
        targetId: feed.id,
        metadata: { url: feed.url },
      },
    });
    redirect("/evidence");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Evidence</div>
          <div className="mt-1 text-sm text-zinc-400">
            Tenant <span className="font-mono text-zinc-200">{tenant.slug}</span> • Role{" "}
            <span className="font-semibold">{membership.role}</span>
          </div>
        </div>
        <a
          href="/tenants"
          className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
        >
          Switch tenant
        </a>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Manual entry</div>
        <div className="mt-1 text-xs text-zinc-500">Creates evidence and dedupes by URL and content hash.</div>

        <form action={createManual} className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400">Source URL (optional)</label>
            <input
              name="sourceUri"
              placeholder="https://example.com/article"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Title (optional)</label>
            <input
              name="title"
              placeholder="Short title…"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Tags (comma-separated)</label>
            <input
              name="tags"
              placeholder="e.g. cisa, healthcare, vendor"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Summary (optional)</label>
            <textarea
              name="summary"
              rows={4}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Content (optional)</label>
            <textarea
              name="contentText"
              rows={4}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Create
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-200">RSS feeds</div>
            <div className="mt-1 text-xs text-zinc-500">
              Worker ingests enabled feeds every ~15 minutes (default CISA feeds are used if none are configured).
            </div>
          </div>
          <a
            href="/admin/members"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Tenant admin
          </a>
        </div>

        <form action={upsertRssFeed} className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400">Feed URL</label>
            <input
              name="url"
              placeholder="https://example.com/feed.xml"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Title (optional)</label>
            <input
              name="title"
              placeholder="Label…"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Add / Enable
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-left text-zinc-300">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
              {feeds.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-200">{f.url}</td>
                  <td className="px-4 py-3 text-zinc-300">{f.title ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{f.enabled ? "enabled" : "disabled"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <form action={toggleRssFeed}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="enabled" value={String(!f.enabled)} />
                        <button className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                          {f.enabled ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteRssFeed}>
                        <input type="hidden" name="id" value={f.id} />
                        <button className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-900">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!feeds.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-zinc-400">
                    No RSS feeds configured in the tenant DB.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-black/40 text-left text-zinc-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Indicators</th>
              <th className="px-4 py-3">Triage</th>
              <th className="px-4 py-3">Fetched</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
            {items.map((e) => (
              <tr key={e.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3 font-semibold text-zinc-100">{e.title ?? e.id}</td>
                <td className="px-4 py-3">
                  {e.sourceUri ? (
                    <a className="text-sky-300 hover:underline" href={e.sourceUri} target="_blank" rel="noreferrer">
                      link
                    </a>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-300">{countByEvidenceId.get(e.id) ?? 0}</td>
                <td className="px-4 py-3 text-zinc-300">{e.triageStatus}</td>
                <td className="px-4 py-3 text-zinc-400">{new Date(e.fetchedAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <form action={enqueueEnrich}>
                    <input type="hidden" name="evidenceId" value={e.id} />
                    <button className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                      Enrich
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-zinc-400">
                  No evidence yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}


