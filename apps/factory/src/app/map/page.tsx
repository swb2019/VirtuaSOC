import { redirect } from "next/navigation";

import { env } from "@/env";
import { requireTenantDb } from "@/lib/tenantContext";
import { getIngestQueue, JOB_EVIDENCE_ENRICH, JOB_PRODUCTS_GENERATE, JOB_SIGNALS_EVALUATE } from "@/lib/queue";
import { MapDashboardClient } from "./MapDashboardClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function geoFromEntityMeta(meta: unknown): { lat: number; lon: number } | null {
  const m = meta as any;
  const g = m?.geo ?? m?.location ?? null;
  const lat = Number(g?.lat ?? g?.latitude ?? NaN);
  const lon = Number(g?.lon ?? g?.lng ?? g?.longitude ?? NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function geoFromEvidenceMeta(meta: unknown): { lat: number; lon: number } | null {
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

function routeFromEntityMeta(meta: unknown): { coords: [number, number][]; corridorKm: number } | null {
  const m = meta as any;
  const g = m?.routeGeometry;
  const corridorKm = Number(m?.corridorKm ?? 5);
  if (!g || typeof g !== "object") return null;
  if (g.type !== "LineString") return null;
  const coordsRaw = Array.isArray(g.coordinates) ? g.coordinates : null;
  if (!coordsRaw?.length) return null;
  const coords: [number, number][] = coordsRaw
    .map((p: any) => [Number(p?.[0] ?? NaN), Number(p?.[1] ?? NaN)] as [number, number])
    .filter((p: [number, number]) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (coords.length < 2) return null;
  return { coords, corridorKm: Number.isFinite(corridorKm) ? corridorKm : 5 };
}

export default async function MapPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  if (!env.featureFactoryApp || !env.featureRbac) redirect("/");
  if (!env.featureSignals) redirect("/");

  const sp = (await searchParams) ?? {};
  const initialEvidenceId = typeof sp?.e === "string" ? sp.e : null;

  const { tenant, tenantDb, membership } = await requireTenantDb("VIEWER");

  const facilities = await tenantDb.entity.findMany({
    where: { tenantId: tenant.id, type: "FACILITY" },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const geofences = await tenantDb.geofence.findMany({
    where: { tenantId: tenant.id, enabled: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const routes = await tenantDb.entity
    .findMany({
      where: { tenantId: tenant.id, type: "ROUTE" },
      orderBy: { createdAt: "desc" },
      take: 500,
    })
    .catch(() => []);

  const signals = await tenantDb.signal.findMany({
    where: { tenantId: tenant.id, kind: { in: ["facility_geofence", "route_corridor"] } },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 300,
    include: {
      evidenceLinks: { include: { evidence: true }, take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  const facilitiesForMap = facilities
    .map((f) => {
      const g = geoFromEntityMeta(f.metadata);
      // Fallback: if facility has a linked geofence, use its center.
      const linked = geofences.find((x) => x.entityId === f.id);
      const lat = g?.lat ?? linked?.centerLat ?? null;
      const lon = g?.lon ?? linked?.centerLon ?? null;
      if (lat === null || lon === null) return null;
      return { id: f.id, name: f.name, lat, lon };
    })
    .filter((x): x is { id: string; name: string; lat: number; lon: number } => Boolean(x));

  const geofencesForMap = geofences.map((g) => ({
    id: g.id,
    name: g.name,
    kind: g.kind,
    centerLat: g.centerLat,
    centerLon: g.centerLon,
    radiusKm: g.radiusKm,
  }));

  const routesForMap = routes
    .map((r) => {
      const parsed = routeFromEntityMeta(r.metadata);
      if (!parsed) return null;
      return { id: r.id, name: r.name, corridorKm: parsed.corridorKm, coords: parsed.coords };
    })
    .filter((x): x is { id: string; name: string; corridorKm: number; coords: [number, number][] } => Boolean(x));

  const signalsForMap = signals
    .map((s) => {
      const evidence = s.evidenceLinks?.[0]?.evidence ?? null;
      const g = evidence ? geoFromEvidenceMeta(evidence.metadata) : null;
      if (!g) return null;
      return {
        id: s.id,
        kind: s.kind,
        title: s.title,
        severity: s.severity,
        score: s.score,
        lat: g.lat,
        lon: g.lon,
        createdAt: s.createdAt.toISOString(),
        meta: {
          ...(((s.metadata as any) ?? {}) as Record<string, unknown>),
          evidenceId: evidence?.id ?? null,
          evidenceTitle: evidence?.title ?? null,
          evidenceSourceUri: evidence?.sourceUri ?? null,
        },
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const evidence = await tenantDb.evidenceItem.findMany({
    where: { tenantId: tenant.id },
    orderBy: { fetchedAt: "desc" },
    take: 800,
  });

  const evidenceForMap = evidence
    .map((e) => {
      const g = geoFromEvidenceMeta(e.metadata);
      if (!g) return null;
      const title = e.title ?? e.summary?.slice(0, 120) ?? e.id;
      return {
        id: e.id,
        title,
        lat: g.lat,
        lon: g.lon,
        triageStatus: e.triageStatus,
        tags: (e.tags ?? []).map(String),
        fetchedAt: e.fetchedAt.toISOString(),
        sourceType: e.sourceType,
        sourceUri: e.sourceUri ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  async function createRoute(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");

    const name = String(formData.get("name") ?? "").trim();
    const corridorKmRaw = Number(String(formData.get("corridorKm") ?? "").trim());
    const geojsonRaw = String(formData.get("routeGeojson") ?? "").trim();

    if (!name) throw new Error("Route name is required");
    if (!geojsonRaw) throw new Error("routeGeojson is required");
    if (!Number.isFinite(corridorKmRaw)) throw new Error("corridorKm is required");
    const corridorKm = Math.max(0.1, Math.min(500, corridorKmRaw));

    let parsed: any;
    try {
      parsed = JSON.parse(geojsonRaw);
    } catch {
      throw new Error("routeGeojson must be valid JSON");
    }
    if (!parsed || parsed.type !== "LineString" || !Array.isArray(parsed.coordinates)) {
      throw new Error("routeGeojson must be a GeoJSON LineString");
    }

    const coords: [number, number][] = parsed.coordinates
      .map((p: any) => [Number(p?.[0] ?? NaN), Number(p?.[1] ?? NaN)] as [number, number])
      .filter((p: [number, number]) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (coords.length < 2) throw new Error("Route must have at least 2 points");

    // Persist as a ROUTE entity (corridor + geometry in metadata).
    const created = await tenantDb.entity.create({
      data: {
        tenantId: tenant.id,
        type: "ROUTE",
        name,
        description: null,
        piiFlag: false,
        metadata: {
          routeGeometry: { type: "LineString", coordinates: coords },
          corridorKm,
          createdBy: membership.userId,
          createdAt: new Date().toISOString(),
        } as any,
      },
    });

    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "route.created",
        actorUserId: membership.userId,
        targetType: "entity",
        targetId: created.id,
        metadata: { type: "ROUTE", name, corridorKm, pointCount: coords.length },
      },
    });

    redirect("/map");
  }

  async function updateEvidence(formData: FormData) {
    "use server";
    const { tenant, tenantDb, membership } = await requireTenantDb("ANALYST");
    const evidenceId = String(formData.get("evidenceId") ?? "").trim();
    if (!evidenceId) throw new Error("evidenceId is required");

    const triageStatusRaw = String(formData.get("triageStatus") ?? "").trim();
    const triageStatus = triageStatusRaw === "triaged" ? "triaged" : triageStatusRaw === "new" ? "new" : null;
    if (!triageStatus) throw new Error("triageStatus must be new|triaged");

    const tagsRaw = String(formData.get("tags") ?? "");
    const tags = Array.from(
      new Set(
        tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 40),
      ),
    );

    const row = await tenantDb.evidenceItem.findFirst({ where: { tenantId: tenant.id, id: evidenceId } });
    if (!row) throw new Error("Evidence not found");

    await tenantDb.evidenceItem.update({
      where: { id: row.id },
      data: { triageStatus, tags },
    });

    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "evidence.updated.map",
        actorUserId: membership.userId,
        targetType: "evidence",
        targetId: row.id,
        metadata: { triageStatus, tagsCount: tags.length },
      },
    });

    // Optional: trigger re-evaluation when tags/status change (idempotent worker side).
    const runId = Date.now();
    await getIngestQueue().add(
      JOB_SIGNALS_EVALUATE,
      { tenantId: tenant.id, evidenceId: row.id },
      { jobId: `sig:${tenant.id}:${row.id}:map:${runId}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );

    redirect(`/map?e=${encodeURIComponent(row.id)}`);
  }

  async function enqueueEnrich(formData: FormData) {
    "use server";
    const { tenant, membership } = await requireTenantDb("ANALYST");
    const evidenceId = String(formData.get("evidenceId") ?? "").trim();
    if (!evidenceId) throw new Error("evidenceId is required");
    const runId = Date.now();
    await getIngestQueue().add(
      JOB_EVIDENCE_ENRICH,
      { tenantId: tenant.id, evidenceId, actorUserId: membership.userId, force: true },
      { jobId: `enrich:${tenant.id}:${evidenceId}:map:${runId}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    redirect(`/map?e=${encodeURIComponent(evidenceId)}`);
  }

  async function enqueueSignalsEvaluate(formData: FormData) {
    "use server";
    const { tenant, membership } = await requireTenantDb("ANALYST");
    const evidenceId = String(formData.get("evidenceId") ?? "").trim();
    if (!evidenceId) throw new Error("evidenceId is required");
    const runId = Date.now();
    await getIngestQueue().add(
      JOB_SIGNALS_EVALUATE,
      { tenantId: tenant.id, evidenceId },
      { jobId: `sig:${tenant.id}:${evidenceId}:map:${runId}`, removeOnComplete: 1000, removeOnFail: 1000 },
    );
    await tenantDb.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "signals.evaluate.queued.map",
        actorUserId: membership.userId,
        targetType: "evidence",
        targetId: evidenceId,
        metadata: {},
      },
    });
    redirect(`/map?e=${encodeURIComponent(evidenceId)}`);
  }

  async function draftFlashAlert(formData: FormData) {
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
        action: "product.generation.queued.map",
        actorUserId: membership.userId,
        targetType: "signal",
        targetId: signalId,
        metadata: { productType: "flash_alert" },
      },
    });

    redirect("/products");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Map</div>
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
            href="/geofences"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Geofences
          </a>
          <a
            href="/evidence"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Evidence
          </a>
          <a
            href="/entities"
            className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
          >
            Entities
          </a>
        </div>
      </div>

      <MapDashboardClient
        tenantSlug={tenant.slug}
        role={membership.role}
        facilities={facilitiesForMap}
        geofences={geofencesForMap}
        signals={signalsForMap}
        routes={routesForMap}
        evidence={evidenceForMap}
        initialEvidenceId={initialEvidenceId}
        createRoute={createRoute}
        updateEvidence={updateEvidence}
        enqueueEnrich={enqueueEnrich}
        enqueueSignalsEvaluate={enqueueSignalsEvaluate}
        draftFlashAlert={draftFlashAlert}
        productFactoryEnabled={env.featureProductFactory}
      />
    </div>
  );
}


