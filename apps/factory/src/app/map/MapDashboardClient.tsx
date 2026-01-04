"use client";

import { useMemo, useState } from "react";

import { MapLibreMapView, type MapGeofence, type MapPoint, type MapSignal, type RouteGeometry } from "@/components/MapLibreMap";

type Props = {
  tenantSlug: string;
  role: string;
  facilities: MapPoint[];
  geofences: MapGeofence[];
  signals: MapSignal[];
  routes: RouteGeometry[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseFloatSafe(v: string): number | null {
  const n = Number(v.trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

export function MapDashboardClient(props: Props) {
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [routeName, setRouteName] = useState("Route");
  const [corridorKm, setCorridorKm] = useState("5");

  const initialCenter = useMemo(() => {
    const f = props.facilities[0];
    if (f) return { lat: f.lat, lon: f.lon };
    const g = props.geofences[0];
    if (g) return { lat: g.centerLat, lon: g.centerLon };
    const s = props.signals[0];
    if (s) return { lat: s.lat, lon: s.lon };
    return { lat: 20, lon: 0 };
  }, [props.facilities, props.geofences, props.signals]);

  const routeGeojson = useMemo(() => {
    if (drawPoints.length < 2) return "";
    return JSON.stringify({ type: "LineString", coordinates: drawPoints });
  }, [drawPoints]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-200">Facility & routes map</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDrawMode((v) => !v);
                if (!drawMode) setDrawPoints([]);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                drawMode ? "bg-indigo-600 text-white hover:bg-indigo-500" : "border border-zinc-800 bg-black/20 text-zinc-100 hover:border-zinc-700"
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

        <div className="mt-4">
          <MapLibreMapView
            initialCenter={initialCenter}
            initialZoom={3}
            facilities={props.facilities}
            geofences={props.geofences}
            signals={props.signals}
            routes={props.routes}
            drawMode={drawMode}
            drawPoints={drawPoints}
            onMapClick={(ll) => {
              if (!drawMode) return;
              const next = [...drawPoints, ll];
              setDrawPoints(next);
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="text-sm font-semibold text-zinc-200">Facilities</div>
          <div className="mt-2 text-xs text-zinc-500">Shown when a facility has geo (or a linked geofence).</div>
          <div className="mt-4 space-y-2 text-sm">
            {props.facilities.slice(0, 12).map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/20 px-3 py-2">
                <div className="font-semibold text-zinc-100">{f.name}</div>
                <a className="text-xs text-sky-300 hover:underline" href={`/entities/${encodeURIComponent(f.id)}`}>
                  Open
                </a>
              </div>
            ))}
            {!props.facilities.length ? <div className="text-sm text-zinc-400">No facilities with geo yet.</div> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="text-sm font-semibold text-zinc-200">Recent alerts</div>
          <div className="mt-2 text-xs text-zinc-500">Recent facility geofence signals (click through to evidence).</div>

          <div className="mt-4 space-y-2 text-sm">
            {props.signals
              .slice()
              .sort((a, b) => (b.severity - a.severity) || b.createdAt.localeCompare(a.createdAt))
              .slice(0, 12)
              .map((s) => {
                const evidenceId = String((s.meta as any)?.evidenceId ?? "");
                const evidenceTitle = String((s.meta as any)?.evidenceTitle ?? "");
                const evidenceHref = evidenceId ? `/evidence/${encodeURIComponent(evidenceId)}` : "/signals";
                return (
                  <div key={s.id} className="rounded-xl border border-zinc-800 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-zinc-400">
                        kind={s.kind} • sev={s.severity} • {new Date(s.createdAt).toLocaleString()}
                      </div>
                      <a className="text-xs text-sky-300 hover:underline" href={evidenceHref}>
                        Open
                      </a>
                    </div>
                    <div className="mt-1 font-semibold text-zinc-100">{s.title}</div>
                    {evidenceTitle ? <div className="mt-1 text-xs text-zinc-400">Evidence: {evidenceTitle}</div> : null}
                  </div>
                );
              })}
            {!props.signals.length ? <div className="text-sm text-zinc-400">No recent geofence/corridor alerts yet.</div> : null}
          </div>

          <div className="mt-4 flex justify-end">
            <a
              href="/signals"
              className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-zinc-700"
            >
              View all signals
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm font-semibold text-zinc-200">Create route (corridor) — next</div>
        <div className="mt-2 text-xs text-zinc-500">
          Route drawing is enabled (toggle <span className="font-semibold text-zinc-200">Draw route</span>), and saving will be wired in the
          next module (c).
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Route name</label>
            <input
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400">Corridor (km)</label>
            <input
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
        <div className="mt-4 rounded-xl border border-zinc-800 bg-black/20 p-3 text-xs text-zinc-400">
          (preview) routeGeometry: <span className="font-mono">{routeGeojson ? `${routeGeojson.slice(0, 120)}…` : "—"}</span>
        </div>
      </div>
    </div>
  );
}


