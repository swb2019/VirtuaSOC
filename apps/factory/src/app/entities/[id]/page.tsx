import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";

export const runtime = "nodejs";

export default async function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureEntityLinking) redirect("/");

  const p = await params;
  const entityId = String(p?.id ?? "").trim();
  if (!entityId) redirect("/entities");

  const { tenant, tenantDb } = await requireTenantDb("VIEWER");

  const entity = await tenantDb.entity.findFirst({
    where: { tenantId: tenant.id, id: entityId },
  });
  if (!entity) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Entity not found</div>
          <div className="mt-4">
            <a
              href="/entities"
              className="rounded-lg border border-zinc-800 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-700"
            >
              Back
            </a>
          </div>
        </div>
      </div>
    );
  }

  const links = await tenantDb.evidenceEntityLink.findMany({
    where: { tenantId: tenant.id, entityId: entity.id },
    include: { evidence: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const recentEvidence = await tenantDb.evidenceItem.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  async function linkEvidence(formData: FormData) {
    "use server";
    const { tenant, tenantDb } = await requireTenantDb("ANALYST");
    const evidenceId = String(formData.get("evidenceId") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;
    if (!evidenceId) throw new Error("evidenceId is required");

    // Ensure entity exists within tenant
    const entityRow = await tenantDb.entity.findFirst({ where: { tenantId: tenant.id, id: entityId } });
    if (!entityRow) throw new Error("Entity not found");

    // Ensure evidence exists within tenant
    const ev = await tenantDb.evidenceItem.findFirst({ where: { tenantId: tenant.id, id: evidenceId } });
    if (!ev) throw new Error("Evidence not found");

    const existing = await tenantDb.evidenceEntityLink.findFirst({
      where: { tenantId: tenant.id, entityId: entityRow.id, evidenceId: ev.id },
    });
    if (!existing) {
      await tenantDb.evidenceEntityLink.create({
        data: {
          tenantId: tenant.id,
          entityId: entityRow.id,
          evidenceId: ev.id,
          notes,
        },
      });
    }

    redirect(`/entities/${encodeURIComponent(entityId)}`);
  }

  async function unlinkEvidence(formData: FormData) {
    "use server";
    const { tenant, tenantDb } = await requireTenantDb("ANALYST");
    const linkId = String(formData.get("linkId") ?? "").trim();
    if (!linkId) throw new Error("linkId is required");
    const row = await tenantDb.evidenceEntityLink.findFirst({ where: { tenantId: tenant.id, id: linkId } });
    if (!row) throw new Error("Not found");
    await tenantDb.evidenceEntityLink.delete({ where: { id: row.id } });
    redirect(`/entities/${encodeURIComponent(entityId)}`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">{entity.name}</div>
          <div className="mt-1 text-sm text-zinc-400">
            {entity.type} • {entity.piiFlag ? "PII" : "non-PII"}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/entities"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Back
          </a>
          <a
            href="/evidence"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Evidence
          </a>
        </div>
      </div>

      {entity.description ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-200">
          {entity.description}
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Link evidence</div>
        <form action={linkEvidence} className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400">Evidence</label>
            <select
              name="evidenceId"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
            >
              {recentEvidence.map((e) => (
                <option key={e.id} value={e.id}>
                  {(e.title ?? e.id).slice(0, 120)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Notes (optional)</label>
            <input
              name="notes"
              placeholder="Why is this relevant?"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Link
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-black/40 text-left text-zinc-300">
            <tr>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
            {links.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-semibold text-zinc-100">{l.evidence.title ?? l.evidence.id}</td>
                <td className="px-4 py-3">
                  {l.evidence.sourceUri ? (
                    <a className="text-sky-300 hover:underline" href={l.evidence.sourceUri} target="_blank" rel="noreferrer">
                      link
                    </a>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-400">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <form action={unlinkEvidence}>
                    <input type="hidden" name="linkId" value={l.id} />
                    <button className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-900">
                      Unlink
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!links.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-zinc-400">
                  No linked evidence yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}


