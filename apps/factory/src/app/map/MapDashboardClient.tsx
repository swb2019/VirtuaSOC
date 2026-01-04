"use client";

import { useEffect, useMemo, useState } from "react";

import {
  MapLibreMapView,
  type MapEvidence,
  type MapGeofence,
  type MapPoint,
  type MapSignal,
  type RouteGeometry,
} from "@/components/MapLibreMap";

type Props = {
  tenantSlug: string;
  role: string;
  facilities: MapPoint[];
  geofences: MapGeofence[];
  signals: MapSignal[];
  routes: RouteGeometry[];
  evidence: MapEvidence[];
  initialEvidenceId: string | null;
  createRoute: (formData: FormData) => void | Promise<void>;
  updateEvidence: (formData: FormData) => void | Promise<void>;
  enqueueEnrich: (formData: FormData) => void | Promise<void>;
  enqueueSignalsEvaluate: (formData: FormData) => void | Promise<void>;
  draftFlashAlert: (formData: FormData) => void | Promise<void>;
  productFactoryEnabled: boolean;
};

type Bounds = { west: number; south: number; east: number; north: number };

function withinBounds(p: { lat: number; lon: number }, b: Bounds): boolean {
  return p.lon >= b.west && p.lon <= b.east && p.lat >= b.south && p.lat <= b.north;
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function kmPerDegreeLat(): number {
  return 110.574;
}

function kmPerDegreeLonAtLat(lat: number): number {
  return 111.32 * Math.cos((lat * Math.PI) / 180);
}

function pointToSegmentDistanceKm(
  p: { lat: number; lon: number },
  a: [number, number], // [lon,lat]
  b: [number, number], // [lon,lat]
): number {
  const kmLon = kmPerDegreeLonAtLat(p.lat);
  const kmLat = kmPerDegreeLat();

  const px = (p.lon - a[0]) * kmLon;
  const py = (p.lat - a[1]) * kmLat;
  const bx = (b[0] - a[0]) * kmLon;
  const by = (b[1] - a[1]) * kmLat;

  const denom = bx * bx + by * by;
  if (!Number.isFinite(denom) || denom <= 0) return Math.hypot(px, py);

  const t = Math.max(0, Math.min(1, (px * bx + py * by) / denom));
  const cx = bx * t;
  const cy = by * t;
  return Math.hypot(px - cx, py - cy);
}

function pointToPolylineDistanceKm(
  p: { lat: number; lon: number },
  coords: [number, number][],
): number {
  if (coords.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointToSegmentDistanceKm(p, coords[i]!, coords[i + 1]!);
    if (d < best) best = d;
  }
  return best;
}

export function MapDashboardClient(props: Props) {
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [routeName, setRouteName] = useState("Route");
  const [corridorKm, setCorridorKm] = useState("5");

  const [showEvidence, setShowEvidence] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const [bounds, setBounds] = useState<Bounds | null>(null);

  const [q, setQ] = useState("");
  const [triage, setTriage] = useState<"all" | "new" | "triaged">("all");
  const [tag, setTag] = useState("");
  const [sourceType, setSourceType] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [scope, setScope] = useState<"all" | "viewport" | "route" | "geofence">("all");
  const [scopeRouteId, setScopeRouteId] = useState<string>("");
  const [scopeGeofenceId, setScopeGeofenceId] = useState<string>("");

  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(props.initialEvidenceId ?? null);
  useEffect(() => {
    if (props.initialEvidenceId) setSelectedEvidenceId(props.initialEvidenceId);
  }, [props.initialEvidenceId]);

  const initialCenter = useMemo(() => {
    const ev = props.evidence[0];
    if (ev) return { lat: ev.lat, lon: ev.lon };
    const f = props.facilities[0];
    if (f) return { lat: f.lat, lon: f.lon };
    const g = props.geofences[0];
    if (g) return { lat: g.centerLat, lon: g.centerLon };
    const s = props.signals[0];
    if (s) return { lat: s.lat, lon: s.lon };
    return { lat: 20, lon: 0 };
  }, [props.evidence, props.facilities, props.geofences, props.signals]);

  const routeGeojson = useMemo(() => {
    if (drawPoints.length < 2) return "";
    return JSON.stringify({ type: "LineString", coordinates: drawPoints });
  }, [drawPoints]);

  const evidenceById = useMemo(() => new Map(props.evidence.map((e) => [e.id, e])), [props.evidence]);

  const signalsByEvidenceId = useMemo(() => {
    const m = new Map<string, MapSignal[]>();
    for (const s of props.signals) {
      const evidenceId = String((s.meta as any)?.evidenceId ?? "");
      if (!evidenceId) continue;
      const arr = m.get(evidenceId) ?? [];
      arr.push(s);
      m.set(evidenceId, arr);
    }
    for (const [k, arr] of m) {
      arr.sort((a, b) => (b.severity - a.severity) || b.createdAt.localeCompare(a.createdAt));
      m.set(k, arr);
    }
    return m;
  }, [props.signals]);

  const maxSevByEvidenceId = useMemo(() => {
    const m = new Map<string, number>();
    for (const [evidenceId, sigs] of signalsByEvidenceId) {
      m.set(evidenceId, sigs.reduce((acc, s) => Math.max(acc, s.severity), 0));
    }
    return m;
  }, [signalsByEvidenceId]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const e of props.evidence) for (const t of e.tags ?? []) s.add(String(t));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [props.evidence]);

  const allSourceTypes = useMemo(() => {
    const s = new Set<string>();
    for (const e of props.evidence) s.add(String(e.sourceType ?? ""));
    return Array.from(s).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [props.evidence]);

  const minTimeMs = useMemo(() => {
    const now = Date.now();
    if (timeRange === "24h") return now - 24 * 60 * 60 * 1000;
    if (timeRange === "7d") return now - 7 * 24 * 60 * 60 * 1000;
    if (timeRange === "30d") return now - 30 * 24 * 60 * 60 * 1000;
    return null;
  }, [timeRange]);

  const selectedRoute = useMemo(() => props.routes.find((r) => r.id === scopeRouteId) ?? null, [props.routes, scopeRouteId]);
  const selectedGeofence = useMemo(() => props.geofences.find((g) => g.id === scopeGeofenceId) ?? null, [props.geofences, scopeGeofenceId]);

  const filteredEvidence = useMemo(() => {
    const qn = q.trim().toLowerCase();
    const tn = tag.trim().toLowerCase();

    return props.evidence
      .filter((e) => {
        if (minTimeMs !== null) {
          const ts = Date.parse(e.fetchedAt);
          if (!Number.isFinite(ts) || ts < minTimeMs) return false;
        }
        if (triage !== "all" && String(e.triageStatus) !== triage) return false;
        if (sourceType !== "all" && String(e.sourceType) !== sourceType) return false;
        if (tn) {
          const has = (e.tags ?? []).some((t) => String(t).toLowerCase() === tn);
          if (!has) return false;
        }
        if (qn) {
          const hay = `${e.title}`.toLowerCase();
          if (!hay.includes(qn)) return false;
        }

        if (scope === "viewport") {
          if (!bounds) return true;
          return withinBounds({ lat: e.lat, lon: e.lon }, bounds);
        }
        if (scope === "geofence") {
          if (!selectedGeofence) return true;
          const d = haversineKm({ lat: e.lat, lon: e.lon }, { lat: selectedGeofence.centerLat, lon: selectedGeofence.centerLon });
          return d <= selectedGeofence.radiusKm;
        }
        if (scope === "route") {
          if (!selectedRoute) return true;
          const d = pointToPolylineDistanceKm({ lat: e.lat, lon: e.lon }, selectedRoute.coords);
          return d <= selectedRoute.corridorKm;
        }
        return true;
      })
      .sort((a, b) => {
        const sa = maxSevByEvidenceId.get(a.id) ?? 0;
        const sb = maxSevByEvidenceId.get(b.id) ?? 0;
        if (sb !== sa) return sb - sa;
        return b.fetchedAt.localeCompare(a.fetchedAt);
      });
  }, [props.evidence, q, tag, triage, sourceType, minTimeMs, scope, bounds, selectedGeofence, selectedRoute, maxSevByEvidenceId]);

  const filteredSignals = useMemo(() => {
    const allow = new Set(filteredEvidence.map((e) => e.id));
    return props.signals.filter((s) => {
      const evidenceId = String((s.meta as any)?.evidenceId ?? "");
      if (!evidenceId) return false;
      return allow.has(evidenceId);
    });
  }, [props.signals, filteredEvidence]);

  const selectedEvidence = selectedEvidenceId ? evidenceById.get(selectedEvidenceId) ?? null : null;
  const selectedSignals = selectedEvidenceId ? signalsByEvidenceId.get(selectedEvidenceId) ?? [] : [];

  const focus = useMemo(() => {
    if (!selectedEvidence) return null;
    return { lat: selectedEvidence.lat, lon: selectedEvidence.lon, zoom: 6 };
  }, [selectedEvidence]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-200">Map triage workbench</div>
              <div className="mt-1 text-xs text-zinc-500">
                evidence={props.evidence.length} • signals={props.signals.length} • routes={props.routes.length} • tenant{" "}
                <span className="font-mono text-zinc-200">{props.tenantSlug}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/evidence"
                className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
              >
                Evidence
              </a>
              <a
                href="/signals"
                className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
              >
                Signals
              </a>
              <button
                onClick={() => {
                  setDrawMode((v) => !v);
                  if (!drawMode) setDrawPoints([]);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  drawMode
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "border border-zinc-800 bg-black/20 text-zinc-100 hover:border-zinc-700"
                }`}
              >
                {drawMode ? "Exit draw mode" : "Draw route"}
              </button>
              {drawMode ? (
                <>
                  <button
                    onClick={() => setDrawPoints((pts) => pts.slice(0, -1))}
                    className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => setDrawPoints([])}
                    className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
                  >
                    Clear
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setShowEvidence((v) => !v)}
              className={`rounded-lg px-3 py-2 font-semibold ${
                showEvidence ? "bg-zinc-800 text-zinc-100" : "border border-zinc-800 bg-black/20 text-zinc-300"
              }`}
            >
              Evidence
            </button>
            <button
              onClick={() => setShowSignals((v) => !v)}
              className={`rounded-lg px-3 py-2 font-semibold ${
                showSignals ? "bg-zinc-800 text-zinc-100" : "border border-zinc-800 bg-black/20 text-zinc-300"
              }`}
            >
              Signals
            </button>
            <button
              onClick={() => setShowFacilities((v) => !v)}
              className={`rounded-lg px-3 py-2 font-semibold ${
                showFacilities ? "bg-zinc-800 text-zinc-100" : "border border-zinc-800 bg-black/20 text-zinc-300"
              }`}
            >
              Facilities
            </button>
            <button
              onClick={() => setShowGeofences((v) => !v)}
              className={`rounded-lg px-3 py-2 font-semibold ${
                showGeofences ? "bg-zinc-800 text-zinc-100" : "border border-zinc-800 bg-black/20 text-zinc-300"
              }`}
            >
              Geofences
            </button>
            <button
              onClick={() => setShowRoutes((v) => !v)}
              className={`rounded-lg px-3 py-2 font-semibold ${
                showRoutes ? "bg-zinc-800 text-zinc-100" : "border border-zinc-800 bg-black/20 text-zinc-300"
              }`}
            >
              Routes
            </button>
          </div>

          <div className="mt-4">
            <MapLibreMapView
              initialCenter={initialCenter}
              initialZoom={3}
              facilities={showFacilities ? props.facilities : []}
              geofences={showGeofences ? props.geofences : []}
              routes={showRoutes ? props.routes : []}
              signals={showSignals ? filteredSignals : []}
              evidence={showEvidence ? filteredEvidence : []}
              drawMode={drawMode}
              drawPoints={drawPoints}
              onMapClick={(ll) => {
                if (!drawMode) return;
                const next = [...drawPoints, ll];
                setDrawPoints(next);
              }}
              onEvidenceClick={(id) => setSelectedEvidenceId(id)}
              onViewportChange={(b) => setBounds(b)}
              focus={focus}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="text-sm font-semibold text-zinc-200">Create route (corridor)</div>
          <div className="mt-2 text-xs text-zinc-500">
            Draw a route on the map (toggle <span className="font-semibold text-zinc-200">Draw route</span>), set the corridor buffer, then save.
          </div>

          <form action={props.createRoute} className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Route name</label>
                <input
                  name="name"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Corridor (km)</label>
                <input
                  name="corridorKm"
                  value={corridorKm}
                  onChange={(e) => setCorridorKm(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Drawn points</label>
                <div className="mt-2 rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs text-zinc-300">
                  {drawPoints.length} points • {drawPoints.length >= 2 ? "LineString ready" : "Add at least 2 points"}
                </div>
              </div>
            </div>

            <input type="hidden" name="routeGeojson" value={routeGeojson} />

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                Geometry preview: <span className="font-mono">{routeGeojson ? `${routeGeojson.slice(0, 120)}…` : "—"}</span>
              </div>
              <button
                disabled={drawPoints.length < 2 || !routeName.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                Save route
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {selectedEvidence ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-100">{selectedEvidence.title}</div>
                <div className="mt-1 text-xs text-zinc-400">
                  triage=<span className="font-semibold text-zinc-200">{selectedEvidence.triageStatus}</span> •{" "}
                  {new Date(selectedEvidence.fetchedAt).toLocaleString()}
                </div>
              </div>
              <a
                href={`/evidence/${encodeURIComponent(selectedEvidence.id)}`}
                className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
              >
                Open
              </a>
            </div>

            {selectedEvidence.sourceUri ? (
              <div className="mt-3 text-xs">
                <a className="text-sky-300 hover:underline" href={selectedEvidence.sourceUri} target="_blank" rel="noreferrer">
                  source link
                </a>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <form action={props.updateEvidence} className="space-y-3">
                <input type="hidden" name="evidenceId" value={selectedEvidence.id} />
                <div>
                  <label className="block text-xs font-semibold text-zinc-400">Triage</label>
                  <select
                    name="triageStatus"
                    defaultValue={selectedEvidence.triageStatus}
                    className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="new">new</option>
                    <option value="triaged">triaged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400">Tags (comma-separated)</label>
                  <input
                    name="tags"
                    defaultValue={(selectedEvidence.tags ?? []).join(", ")}
                    className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                    list="taglist"
                  />
                </div>
                <div className="flex justify-end">
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                    Save + re-evaluate
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <form action={props.enqueueEnrich}>
                  <input type="hidden" name="evidenceId" value={selectedEvidence.id} />
                  <button className="w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                    Enrich now
                  </button>
                </form>
                <form action={props.enqueueSignalsEvaluate}>
                  <input type="hidden" name="evidenceId" value={selectedEvidence.id} />
                  <button className="w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700">
                    Re-evaluate signals
                  </button>
                </form>
                {props.productFactoryEnabled && selectedSignals.length ? (
                  <form action={props.draftFlashAlert}>
                    <input type="hidden" name="signalId" value={selectedSignals[0]!.id} />
                    <button className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                      Draft Flash Alert (top signal)
                    </button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-300">Signals ({selectedSignals.length})</div>
              <div className="mt-2 space-y-2">
                {selectedSignals.slice(0, 8).map((s) => (
                  <div key={s.id} className="rounded-xl border border-zinc-800 bg-black/20 p-3 text-xs text-zinc-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{s.title}</div>
                      <div className="rounded-full border border-zinc-800 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-200">
                        sev {s.severity}
                      </div>
                    </div>
                    <div className="mt-1 text-zinc-400">
                      kind={s.kind} • {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                {!selectedSignals.length ? <div className="text-xs text-zinc-500">No signals linked to this evidence yet.</div> : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-400">
            Click an evidence point (green/gray) to triage it.
          </div>
        )}

        <datalist id="taglist">
          {allTags.slice(0, 500).map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="text-sm font-semibold text-zinc-200">Filters</div>
          <div className="mt-4 grid gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400">Search (title)</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Triage</label>
                <select
                  value={triage}
                  onChange={(e) => setTriage(e.target.value as any)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="all">all</option>
                  <option value="new">new</option>
                  <option value="triaged">triaged</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Time range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="24h">24h</option>
                  <option value="7d">7d</option>
                  <option value="30d">30d</option>
                  <option value="all">all</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Tag</label>
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. protest"
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                  list="taglist"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Source type</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="all">all</option>
                  {allSourceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400">Spatial scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
              >
                <option value="all">all</option>
                <option value="viewport">current viewport</option>
                <option value="route">near route corridor</option>
                <option value="geofence">inside geofence</option>
              </select>
            </div>

            {scope === "route" ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Route</label>
                <select
                  value={scopeRouteId}
                  onChange={(e) => setScopeRouteId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">(select route)</option>
                  {props.routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.corridorKm.toFixed(1)}km)
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {scope === "geofence" ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Geofence</label>
                <select
                  value={scopeGeofenceId}
                  onChange={(e) => setScopeGeofenceId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">(select geofence)</option>
                  {props.geofences.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.radiusKm.toFixed(1)}km)
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {scope === "viewport" ? (
              <div className="text-xs text-zinc-500">
                {bounds ? (
                  <span className="font-mono">
                    west={bounds.west.toFixed(2)} east={bounds.east.toFixed(2)} south={bounds.south.toFixed(2)} north=
                    {bounds.north.toFixed(2)}
                  </span>
                ) : (
                  "Move the map to set bounds."
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-200">Evidence ({filteredEvidence.length})</div>
            <div className="text-xs text-zinc-500">sorted by severity then time</div>
          </div>

          <div className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-1">
            {filteredEvidence.slice(0, 500).map((e) => {
              const sev = maxSevByEvidenceId.get(e.id) ?? 0;
              const selected = e.id === selectedEvidenceId;
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedEvidenceId(e.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left ${
                    selected ? "border-indigo-500 bg-indigo-950/20" : "border-zinc-800 bg-black/20 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold text-zinc-100">{e.title}</div>
                    {sev > 0 ? (
                      <div className="rounded-full border border-zinc-800 bg-black/30 px-3 py-1 text-xs font-semibold text-zinc-200">
                        sev {sev}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">{e.triageStatus}</div>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span>{e.sourceType}</span>
                    <span>•</span>
                    <span>{new Date(e.fetchedAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(e.tags ?? []).slice(0, 6).map((t) => (
                      <span key={t} className="rounded-md border border-zinc-800 bg-black/30 px-2 py-1 text-xs text-zinc-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
            {!filteredEvidence.length ? <div className="text-sm text-zinc-400">No evidence matches your filters.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}


