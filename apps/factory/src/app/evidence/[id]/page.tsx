import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { getIngestQueue, JOB_EVIDENCE_ENRICH } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EvidenceDetailPage({ params }: { params: { id: string } }) {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureEvidenceIngest) redirect("/evidence");

  const evidenceId = String(params.id ?? "").trim();
  if (!evidenceId) notFound();

  const { tenant, tenantDb } = await requireTenantDb("VIEWER");

  const evidence = await tenantDb.evidenceItem.findFirst({
    where: { tenantId: tenant.id, id: evidenceId },
  });
  if (!evidence) notFound();

  const indicators = await tenantDb.evidenceIndicator.findMany({
    where: { tenantId: tenant.id, evidenceId },
    orderBy: [{ kind: "asc" }, { normalizedValue: "asc" }],
    take: 2000,
  });

  const enrichment = (evidence.metadata as any)?.enrichment ?? null;
  const fetch = enrichment?.fetch ?? null;

  async function enqueueEnrich() {
    "use server";
    const { tenant, membership } = await requireTenantDb("ANALYST");
    await getIngestQueue().add(
      JOB_EVIDENCE_ENRICH,
      { tenantId: tenant.id, evidenceId, actorUserId: membership.userId, force: true },
      { jobId: `enrich:${tenant.id}:${evidenceId}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    redirect(`/evidence/${evidenceId}`);
  }

  const byKind = indicators.reduce<Record<string, string[]>>((acc, r) => {
    const k = r.kind;
    acc[k] = acc[k] ?? [];
    acc[k]!.push(r.normalizedValue);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs text-zinc-400">
            <Link className="hover:underline" href="/evidence">
              Evidence
            </Link>{" "}
            <span className="text-zinc-600">/</span> {evidence.id}
          </div>
          <div className="text-lg font-semibold">{evidence.title ?? "Evidence"}</div>
        </div>
        <form action={enqueueEnrich}>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Enrich now
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-zinc-400">Source</div>
            <div className="mt-1 text-sm">
              {evidence.sourceUri ? (
                <a className="text-sky-300 hover:underline" href={evidence.sourceUri} target="_blank" rel="noreferrer">
                  {evidence.sourceUri}
                </a>
              ) : (
                <span className="text-zinc-500">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400">Fetched</div>
            <div className="mt-1 text-sm text-zinc-200">{new Date(evidence.fetchedAt).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400">Triage</div>
            <div className="mt-1 text-sm text-zinc-200">{evidence.triageStatus}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400">Tags</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {(evidence.tags ?? []).length ? (
                (evidence.tags ?? []).map((t) => (
                  <span key={t} className="rounded-md border border-zinc-800 bg-black/30 px-2 py-1 text-xs">
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-sm text-zinc-500">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Enrichment</div>
          <div className="text-xs text-zinc-400">
            lastRunAt: {typeof enrichment?.lastRunAt === "string" ? enrichment.lastRunAt : "—"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
            <div className="text-xs font-semibold text-zinc-400">Fetch</div>
            <div className="mt-2 space-y-1 text-xs text-zinc-200">
              <div>ok: {String(fetch?.ok ?? false)}</div>
              <div>status: {fetch?.status ?? "—"}</div>
              <div>finalUrl: {fetch?.finalUrl ?? "—"}</div>
              <div>contentType: {fetch?.contentType ?? "—"}</div>
              <div>sha256: {fetch?.sha256 ?? "—"}</div>
              {fetch?.error ? <div className="text-rose-300">error: {String(fetch.error)}</div> : null}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
            <div className="text-xs font-semibold text-zinc-400">LLM excerpt (sanitized)</div>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-800 bg-black/30 p-3 text-xs text-zinc-200">
              {typeof enrichment?.llmExcerpt === "string" && enrichment.llmExcerpt.trim()
                ? enrichment.llmExcerpt
                : "—"}
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Indicators</div>
          <div className="text-xs text-zinc-400">{indicators.length} total</div>
        </div>

        {!indicators.length ? (
          <div className="mt-4 text-sm text-zinc-400">No extracted indicators yet. Run enrichment.</div>
        ) : (
          <div className="mt-4 space-y-4">
            {Object.entries(byKind).map(([kind, values]) => (
              <div key={kind}>
                <div className="text-xs font-semibold text-zinc-400">{kind.toUpperCase()}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {values.slice(0, 200).map((v) => (
                    <span
                      key={`${kind}:${v}`}
                      className="rounded-md border border-zinc-800 bg-black/30 px-2 py-1 font-mono text-xs text-zinc-200"
                      title={v}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


