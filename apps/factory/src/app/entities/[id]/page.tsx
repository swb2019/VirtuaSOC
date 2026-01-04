import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { MapLibreMapView, type MapGeofence, type MapPoint, type MapSignal } from "@/components/MapLibreMap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseFloatSafe(v: unknown): number | null {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

function geoFromMeta(meta: unknown): { lat: number; lon: number } | null {
  const m = meta as any;
  const candidates = [m?.geo, m?.location, m?.raw?.geo, m?.raw?.location, m?.raw, m];
  for (const c of candidates) {
    const lat = Number(c?.lat ?? c?.latitude ?? NaN);
    const lon = Number(c?.lon ?? c?.lng ?? c?.longitude ?? NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    return { lat, lon };
  }
  return null;
}

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

  const facilityGeofences =
    entity.type === "FACILITY"
      ? await tenantDb.geofence
          .findMany({
            where: { tenantId: tenant.id, entityId: entity.id },
            orderBy: { createdAt: "desc" },
            take: 50,
          })
          .catch(() => [])
      : [];

  const facilitySignals =
    entity.type === "FACILITY"
      ? await tenantDb.signal
          .findMany({
            where: {
              tenantId: tenant.id,
              kind: "facility_geofence",
              entityLinks: { some: { tenantId: tenant.id, entityId: entity.id } },
            },
            orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
            take: 50,
            include: { evidenceLinks: { include: { evidence: true }, take: 1, orderBy: { createdAt: "desc" } } },
          })
          .catch(() => [])
      : [];

  const recentEvidence = await tenantDb.evidenceItem.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  async function updateFacilityGeo(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");

    const lat = parseFloatSafe(formData.get("lat"));
    const lon = parseFloatSafe(formData.get("lon"));
    const clear = String(formData.get("clear") ?? "").trim() === "1";

    const row = await tenantDb.entity.findFirst({ where: { tenantId: tenant.id, id: entityId } });
    if (!row) throw new Error("Entity not found");
    if (row.type !== "FACILITY") throw new Error("Only FACILITY entities support geo");

    const meta = (row.metadata as any) ?? {};
    const nextMeta = { ...meta } as any;

    if (clear) {
      delete nextMeta.geo;
    } else {
      if (lat === null || lon === null) throw new Error("lat/lon are required (or use Clear)");
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error("Invalid lat/lon");
      nextMeta.geo = { lat, lon };
    }

    await tenantDb.entity.update({
      where: { id: row.id },
      data: { metadata: nextMeta as any, updatedAt: new Date() },
    });

    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "facility.geo.updated",
        actorUserId: membership.userId,
        targetType: "entity",
        targetId: row.id,
        metadata: { lat: nextMeta.geo?.lat ?? null, lon: nextMeta.geo?.lon ?? null },
      },
    });

    redirect(`/entities/${encodeURIComponent(entityId)}`);
  }

  async function linkEvidence(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
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
      const link = await tenantDb.evidenceEntityLink.create({
        data: {
          tenantId: tenant.id,
          entityId: entityRow.id,
          evidenceId: ev.id,
          notes,
        },
      });
      await tenantDb.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: "evidence.linked_to_entity",
          actorUserId: membership.userId,
          targetType: "evidence_entity_link",
          targetId: link.id,
          metadata: { entityId: entityRow.id, evidenceId: ev.id },
        },
      });
    }

    redirect(`/entities/${encodeURIComponent(entityId)}`);
  }

  async function unlinkEvidence(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const linkId = String(formData.get("linkId") ?? "").trim();
    if (!linkId) throw new Error("linkId is required");
    const row = await tenantDb.evidenceEntityLink.findFirst({ where: { tenantId: tenant.id, id: linkId } });
    if (!row) throw new Error("Not found");
    await tenantDb.evidenceEntityLink.delete({ where: { id: row.id } });
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "evidence.unlinked_from_entity",
        actorUserId: membership.userId,
        targetType: "evidence_entity_link",
        targetId: row.id,
        metadata: { entityId: row.entityId, evidenceId: row.evidenceId },
      },
    });
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
            href="/map"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Map
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

      {entity.type === "FACILITY" ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-200">Facility location</div>
              <div className="mt-1 text-xs text-zinc-500">Used by map view and geo OSINT connectors (no LLM geocoding).</div>
            </div>
            <a
              href="/geofences"
              className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
            >
              Manage geofences
            </a>
          </div>

          {(() => {
            const g = geoFromMeta(entity.metadata);
            const facilityPoint: MapPoint[] = g ? [{ id: entity.id, name: entity.name, lat: g.lat, lon: g.lon }] : [];
            const geos: MapGeofence[] = (facilityGeofences ?? []).map((x) => ({
              id: x.id,
              name: x.name,
              kind: x.kind,
              centerLat: x.centerLat,
              centerLon: x.centerLon,
              radiusKm: x.radiusKm,
            }));

            const sigs: MapSignal[] = (facilitySignals ?? [])
              .map((s) => {
                const ev = s.evidenceLinks?.[0]?.evidence ?? null;
                const eg = ev ? geoFromMeta(ev.metadata) : null;
                if (!eg) return null;
                return {
                  id: s.id,
                  kind: s.kind,
                  title: s.title,
                  severity: s.severity,
                  score: s.score,
                  lat: eg.lat,
                  lon: eg.lon,
                  createdAt: s.createdAt.toISOString(),
                  meta: (s.metadata as any) ?? {},
                };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null);

            const initialCenter =
              g ?? (geos.length ? { lat: geos[0]!.centerLat, lon: geos[0]!.centerLon } : { lat: 20, lon: 0 });

            return (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <MapLibreMapView
                    initialCenter={initialCenter}
                    initialZoom={g ? 11 : 4}
                    facilities={facilityPoint}
                    geofences={geos}
                    signals={sigs}
                    routes={[]}
                  />
                </div>
                <div className="space-y-4">
                  <form action={updateFacilityGeo} className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400">Lat</label>
                        <input
                          name="lat"
                          defaultValue={g ? String(g.lat) : ""}
                          placeholder="38.8977"
                          className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400">Lon</label>
                        <input
                          name="lon"
                          defaultValue={g ? String(g.lon) : ""}
                          placeholder="-77.0365"
                          className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        name="clear"
                        value="1"
                        className="rounded-lg border border-zinc-800 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-700"
                      >
                        Clear
                      </button>
                      <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        Save
                      </button>
                    </div>
                  </form>

                  <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                    <div className="text-xs font-semibold text-zinc-300">Linked geofences</div>
                    <div className="mt-2 space-y-2 text-sm">
                      {(facilityGeofences ?? []).map((gf) => (
                        <div key={gf.id} className="flex items-center justify-between">
                          <div className="text-zinc-200">
                            {gf.name} <span className="text-xs text-zinc-500">({gf.radiusKm.toFixed(1)} km)</span>
                          </div>
                          <div className="text-xs text-zinc-400">{gf.enabled ? "enabled" : "disabled"}</div>
                        </div>
                      ))}
                      {!facilityGeofences?.length ? <div className="text-sm text-zinc-500">No geofences linked yet.</div> : null}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-zinc-300">Recent facility alerts</div>
                      <a className="text-xs text-sky-300 hover:underline" href="/signals">
                        Open signals
                      </a>
                    </div>
                    <div className="mt-2 space-y-2 text-sm">
                      {(facilitySignals ?? []).slice(0, 8).map((s) => (
                        <div key={s.id} className="flex items-center justify-between">
                          <div className="text-zinc-200">{s.title}</div>
                          <div className="text-xs text-zinc-400">sev {s.severity}</div>
                        </div>
                      ))}
                      {!facilitySignals?.length ? <div className="text-sm text-zinc-500">No facility geofence signals yet.</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
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


