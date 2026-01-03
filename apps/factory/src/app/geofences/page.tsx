import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseFloatSafe(v: unknown): number | null {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeTags(raw: unknown): string[] {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export default async function GeofencesPage() {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureSignals) redirect("/");

  const { tenant, tenantDb, membership } = await requireTenantDb("VIEWER");

  const facilities = await tenantDb.entity.findMany({
    where: { tenantId: tenant.id, type: "FACILITY" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const geofences = await tenantDb.geofence.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { entity: true },
  });

  async function createGeofence(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");

    const name = String(formData.get("name") ?? "").trim();
    const kind = String(formData.get("kind") ?? "").trim() || "facility";
    const centerLat = parseFloatSafe(formData.get("centerLat"));
    const centerLon = parseFloatSafe(formData.get("centerLon"));
    const radiusKmRaw = parseFloatSafe(formData.get("radiusKm"));
    const entityIdRaw = String(formData.get("entityId") ?? "").trim() || null;
    const tags = normalizeTags(formData.get("tags"));

    if (!name) throw new Error("Name is required");
    if (centerLat === null || centerLon === null) throw new Error("Center lat/lon are required");
    if (centerLat < -90 || centerLat > 90 || centerLon < -180 || centerLon > 180) throw new Error("Invalid lat/lon");
    if (radiusKmRaw === null) throw new Error("Radius km is required");
    const radiusKm = clamp(radiusKmRaw, 0.1, 500);

    const entityId = entityIdRaw ? entityIdRaw : null;

    const created = await tenantDb.geofence.create({
      data: {
        tenantId: tenant.id,
        name,
        kind,
        enabled: true,
        centerLat,
        centerLon,
        radiusKm,
        entityId,
        tags,
        metadata: {},
      },
    });

    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "geofence.created",
        actorUserId: membership.userId,
        targetType: "geofence",
        targetId: created.id,
        metadata: { name, kind, radiusKm, entityId },
      },
    });

    redirect("/geofences");
  }

  async function toggleEnabled(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("id is required");
    const enabledRaw = String(formData.get("enabled") ?? "").trim().toLowerCase();
    const enabled = enabledRaw === "true";

    const row = await tenantDb.geofence.findFirst({ where: { tenantId: tenant.id, id } });
    if (!row) throw new Error("Not found");

    await tenantDb.geofence.update({ where: { id: row.id }, data: { enabled, updatedAt: new Date() } });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "geofence.updated",
        actorUserId: membership.userId,
        targetType: "geofence",
        targetId: row.id,
        metadata: { enabled },
      },
    });

    redirect("/geofences");
  }

  async function deleteGeofence(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("id is required");

    const row = await tenantDb.geofence.findFirst({ where: { tenantId: tenant.id, id } });
    if (!row) throw new Error("Not found");

    await tenantDb.geofence.delete({ where: { id: row.id } });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "geofence.deleted",
        actorUserId: membership.userId,
        targetType: "geofence",
        targetId: row.id,
        metadata: { name: row.name },
      },
    });

    redirect("/geofences");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Geofences</div>
          <div className="mt-1 text-sm text-zinc-400">
            Tenant <span className="font-mono text-zinc-200">{tenant.slug}</span> • Role{" "}
            <span className="font-semibold">{membership.role}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/signals"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Signals
          </a>
          <a
            href="/evidence"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Evidence
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
        <div className="text-sm font-semibold text-zinc-200">Create geofence</div>
        <div className="mt-1 text-xs text-zinc-500">Used to generate facility/reputation signals from geo-tagged OSINT evidence.</div>

        <form action={createGeofence} className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400">Name</label>
            <input
              name="name"
              placeholder="e.g. HQ Campus, DC Office, Plant 12"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Kind</label>
            <select
              name="kind"
              defaultValue="facility"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="facility">facility</option>
              <option value="reputation">reputation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400">Center lat</label>
            <input
              name="centerLat"
              placeholder="38.8977"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Center lon</label>
            <input
              name="centerLon"
              placeholder="-77.0365"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Radius (km)</label>
            <input
              name="radiusKm"
              placeholder="5"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400">Link to Facility entity (optional)</label>
            <select
              name="entityId"
              defaultValue=""
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">—</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Tags (comma-separated)</label>
            <input
              name="tags"
              placeholder="protest, violence, activism"
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Radius</th>
              <th className="px-4 py-3">Center</th>
              <th className="px-4 py-3">Linked facility</th>
              <th className="px-4 py-3">Enabled</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
            {geofences.map((g) => (
              <tr key={g.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3 font-semibold text-zinc-100">{g.name}</td>
                <td className="px-4 py-3 text-zinc-300">{g.kind}</td>
                <td className="px-4 py-3 text-zinc-300">{g.radiusKm.toFixed(1)} km</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                  {g.centerLat.toFixed(5)}, {g.centerLon.toFixed(5)}
                </td>
                <td className="px-4 py-3 text-zinc-300">{g.entity?.name ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-300">{g.enabled ? "yes" : "no"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <form action={toggleEnabled}>
                      <input type="hidden" name="id" value={g.id} />
                      <input type="hidden" name="enabled" value={String(!g.enabled)} />
                      <button className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                        {g.enabled ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={deleteGeofence}>
                      <input type="hidden" name="id" value={g.id} />
                      <button className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-200 hover:border-rose-900">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!geofences.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-zinc-400">
                  No geofences yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}


