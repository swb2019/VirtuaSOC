import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { ENTITY_TYPES, normalizeEntityType } from "@/lib/entities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EntitiesPage() {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureEntityLinking) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-zinc-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <div className="text-lg font-semibold">Entities</div>
          <div className="mt-2 text-sm text-zinc-400">M3 (Entity linking) is not enabled yet.</div>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-4 text-xs text-zinc-300">
            Set <code className="text-zinc-200">FEATURE_ENTITY_LINKING=true</code> to enable.
          </div>
        </div>
      </div>
    );
  }

  const { tenant, tenantDb, membership } = await requireTenantDb("VIEWER");

  const entities = await tenantDb.entity.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  async function createEntity(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const type = normalizeEntityType(formData.get("type"));
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    if (!type) throw new Error("Invalid type");
    if (!name) throw new Error("Name is required");

    const created = await tenantDb.entity.create({
      data: {
        tenantId: tenant.id,
        type,
        name,
        description,
        piiFlag: type === "PERSON",
        metadata: {},
      },
    });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "entity.created",
        actorUserId: membership.userId,
        targetType: "entity",
        targetId: created.id,
        metadata: { type, name, piiFlag: created.piiFlag },
      },
    });

    redirect("/entities");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Entities</div>
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
            href="/tenants"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Switch tenant
          </a>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Create entity</div>
        <form action={createEntity} className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Type</label>
            <select
              name="type"
              defaultValue="ORG"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Name</label>
            <input
              name="name"
              placeholder="Entity name…"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-zinc-400">Description (optional)</label>
            <input
              name="description"
              placeholder="Short description…"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Create
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-black/40 text-left text-zinc-300">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">PII</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
            {entities.map((e) => (
              <tr key={e.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3 text-zinc-300">{e.type}</td>
                <td className="px-4 py-3 font-semibold text-zinc-100">{e.name}</td>
                <td className="px-4 py-3 text-zinc-300">{e.piiFlag ? "yes" : "no"}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/entities/${encodeURIComponent(e.id)}`}
                    className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
                  >
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {!entities.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-zinc-400">
                  No entities yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}


