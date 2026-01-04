import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { getIngestQueue, JOB_PRODUCTS_GENERATE } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureSignals) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Signals</div>
          <div className="mt-2 text-sm text-zinc-400">M4 (Signals) is not enabled yet.</div>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-4 text-xs text-zinc-300">
            Set <code className="text-zinc-200">FEATURE_SIGNALS=true</code> to enable.
          </div>
        </div>
      </div>
    );
  }

  const { tenant, tenantDb, membership } = await requireTenantDb("VIEWER");

  async function generateFlashAlert(formData: FormData) {
    "use server";
    if (!env.featureProductFactory) throw new Error("Product Factory is not enabled");
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const signalId = String(formData.get("signalId") ?? "").trim();
    if (!signalId) throw new Error("signalId is required");

    await getIngestQueue().add(
      JOB_PRODUCTS_GENERATE,
      { tenantId: tenant.id, productType: "flash_alert", signalId, actorUserId: membership.userId },
      { jobId: `prodgen:${tenant.id}:flash_alert:sig:${signalId}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "product.generation.queued",
        actorUserId: membership.userId,
        targetType: "signal",
        targetId: signalId,
        metadata: { productType: "flash_alert" },
      },
    });

    redirect("/products");
  }

  let signals: any[] = [];
  try {
    signals = await tenantDb.signal.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        evidenceLinks: { include: { evidence: true }, take: 5, orderBy: { createdAt: "desc" } },
        entityLinks: { include: { entity: true }, take: 5, orderBy: { createdAt: "desc" } },
      },
    });
  } catch (e) {
    // Likely migrations not applied yet.
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Signals</div>
          <div className="mt-2 text-sm text-zinc-400">
            Signals tables aren’t available yet. Ensure tenant migrations have been applied.
          </div>
          <div className="mt-6 text-xs text-zinc-500">{String((e as any)?.message ?? e)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Signals</div>
          <div className="mt-1 text-sm text-zinc-400">
            Tenant <span className="font-mono text-zinc-200">{tenant.slug}</span> • Role{" "}
            <span className="font-semibold">{membership.role}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/evidence"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Evidence
          </a>
          <a
            href="/map"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Map
          </a>
          <a
            href="/geofences"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Geofences
          </a>
          <a
            href="/entities"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Entities
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {signals.map((s) => (
          <div key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-100">{s.title}</div>
                <div className="mt-1 text-xs text-zinc-400">
                  kind={s.kind} • severity={s.severity} • score={s.score} • status={s.status} •{" "}
                  {new Date(s.createdAt).toLocaleString()}
                </div>
                  {s.kind === "facility_geofence" ? (
                    <div className="mt-2 text-xs text-zinc-300">
                      <span className="rounded-md border border-zinc-800 bg-black/20 px-2 py-1">
                        geofence: {String((s.metadata as any)?.geofenceName ?? "—")} •{" "}
                        {typeof (s.metadata as any)?.distanceKm === "number"
                          ? `${(s.metadata as any).distanceKm.toFixed(2)} km`
                          : "—"}
                      </span>
                    </div>
                  ) : null}
              </div>
              <div className="flex items-center gap-2">
                {env.featureProductFactory ? (
                  <form action={generateFlashAlert}>
                    <input type="hidden" name="signalId" value={s.id} />
                    <button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                      Draft Flash Alert
                    </button>
                  </form>
                ) : null}
                <div className="rounded-full border border-zinc-800 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-200">
                  sev {s.severity}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-zinc-300">Evidence (top)</div>
                <div className="mt-2 space-y-2">
                  {(s.evidenceLinks ?? []).map((l: any) => (
                    <div key={l.id} className="rounded-xl border border-zinc-800 bg-black/20 p-3 text-xs text-zinc-200">
                      <div className="font-semibold">{l.evidence.title ?? l.evidence.id}</div>
                      {l.evidence.sourceUri ? (
                        <div className="mt-1">
                          <a className="text-sky-300 hover:underline" href={l.evidence.sourceUri} target="_blank" rel="noreferrer">
                            {l.evidence.sourceUri}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {!s.evidenceLinks?.length ? <div className="text-xs text-zinc-500">No evidence links.</div> : null}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-300">Entities (top)</div>
                <div className="mt-2 space-y-2">
                  {(s.entityLinks ?? []).map((l: any) => (
                    <div key={l.id} className="rounded-xl border border-zinc-800 bg-black/20 p-3 text-xs text-zinc-200">
                      <div className="font-semibold">{l.entity.name}</div>
                      <div className="mt-1 text-zinc-400">{l.entity.type}</div>
                    </div>
                  ))}
                  {!s.entityLinks?.length ? <div className="text-xs text-zinc-500">No entity links.</div> : null}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-300">Rationale</div>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-black/20 p-3 text-xs text-zinc-300">
                {JSON.stringify(s.rationale ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        ))}
        {!signals.length ? <div className="text-sm text-zinc-400">No signals yet.</div> : null}
      </div>
    </div>
  );
}


