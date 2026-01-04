"use client";

import maplibregl, { type Map as MapLibreMap, type MapMouseEvent, type StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

export type MapPoint = { id: string; name: string; lat: number; lon: number };

export type MapGeofence = {
  id: string;
  name: string;
  kind: string;
  centerLat: number;
  centerLon: number;
  radiusKm: number;
};

export type MapSignal = {
  id: string;
  kind: string;
  title: string;
  severity: number;
  score: number;
  lat: number;
  lon: number;
  createdAt: string;
  meta?: Record<string, unknown>;
};

export type MapEvidence = {
  id: string;
  title: string;
  lat: number;
  lon: number;
  triageStatus: string;
  tags: string[];
  fetchedAt: string;
  sourceType: string;
  sourceUri: string | null;
};

export type RouteGeometry = {
  id: string;
  name: string;
  corridorKm: number;
  // GeoJSON LineString coordinates: [lon, lat]
  coords: [number, number][];
};

export type MapLibreMapProps = {
  className?: string;
  initialCenter?: { lat: number; lon: number };
  initialZoom?: number;
  facilities: MapPoint[];
  geofences: MapGeofence[];
  signals: MapSignal[];
  routes: RouteGeometry[];
  evidence?: MapEvidence[];
  drawMode?: boolean;
  drawPoints?: [number, number][]; // [lon,lat]
  onMapClick?: (lonLat: [number, number]) => void;
  onEvidenceClick?: (evidenceId: string) => void;
  onViewportChange?: (bounds: { west: number; south: number; east: number; north: number }) => void;
  focus?: { lat: number; lon: number; zoom?: number } | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function kmToPixelsAtLatZoom(km: number, lat: number, zoom: number): number {
  // Approx meters per pixel at latitude.
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) return 1;
  return (km * 1000) / metersPerPixel;
}

function circlePolygon(center: { lat: number; lon: number }, radiusKm: number, steps = 64): any {
  const coords: [number, number][] = [];
  const latRad = (center.lat * Math.PI) / 180;
  const d = radiusKm / 6371; // angular distance
  for (let i = 0; i <= steps; i++) {
    const brng = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(brng),
    );
    const lon2 =
      (center.lon * Math.PI) / 180 +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(lat2),
      );
    coords.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

function asFeatureCollection(features: any[]) {
  return { type: "FeatureCollection", features };
}

function signalColor(sev: number): string {
  if (sev >= 5) return "#ef4444"; // red
  if (sev >= 4) return "#f97316"; // orange
  if (sev >= 3) return "#facc15"; // yellow
  if (sev >= 2) return "#38bdf8"; // sky
  return "#a1a1aa"; // zinc
}

export function MapLibreMapView(props: MapLibreMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [zoom, setZoom] = useState<number>(props.initialZoom ?? 2.5);

  const center = props.initialCenter ?? { lat: 20, lon: 0 };

  const basemapStyle: StyleSpecification = useMemo(
    () => ({
      version: 8,
      sources: {
        countries: {
          type: "geojson",
          data: "/basemap/ne_110m_admin_0_countries.geojson",
        },
      },
      layers: [
        { id: "bg", type: "background", paint: { "background-color": "#0a0a0a" } },
        {
          id: "countries-fill",
          type: "fill",
          source: "countries",
          paint: { "fill-color": "#111827", "fill-opacity": 0.25 },
        },
        {
          id: "countries-outline",
          type: "line",
          source: "countries",
          paint: { "line-color": "#334155", "line-width": 1 },
        },
      ],
    }),
    [],
  );

  const facilitiesFc = useMemo(
    () =>
      asFeatureCollection(
        props.facilities.map((f) => ({
          type: "Feature",
          properties: { id: f.id, name: f.name },
          geometry: { type: "Point", coordinates: [f.lon, f.lat] },
        })),
      ),
    [props.facilities],
  );

  const signalsFc = useMemo(
    () =>
      asFeatureCollection(
        props.signals.map((s) => ({
          type: "Feature",
          properties: { id: s.id, title: s.title, severity: s.severity, kind: s.kind },
          geometry: { type: "Point", coordinates: [s.lon, s.lat] },
        })),
      ),
    [props.signals],
  );

  const evidenceFc = useMemo(() => {
    const ev = props.evidence ?? [];
    return asFeatureCollection(
      ev.map((e) => ({
        type: "Feature",
        properties: {
          id: e.id,
          title: e.title,
          triageStatus: e.triageStatus,
          fetchedAt: e.fetchedAt,
          sourceType: e.sourceType,
        },
        geometry: { type: "Point", coordinates: [e.lon, e.lat] },
      })),
    );
  }, [props.evidence]);

  const geofencesFc = useMemo(
    () =>
      asFeatureCollection(
        props.geofences.map((g) => circlePolygon({ lat: g.centerLat, lon: g.centerLon }, g.radiusKm, 96)),
      ),
    [props.geofences],
  );

  const routesFc = useMemo(() => {
    const features = props.routes.map((r) => ({
      type: "Feature",
      properties: { id: r.id, name: r.name, corridorKm: r.corridorKm, corridorPx: 2 },
      geometry: { type: "LineString", coordinates: r.coords },
    }));
    return asFeatureCollection(features);
  }, [props.routes]);

  const drawLineFc = useMemo(() => {
    if (!props.drawPoints?.length) return asFeatureCollection([]);
    return asFeatureCollection([
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: props.drawPoints },
      },
    ]);
  }, [props.drawPoints]);

  useEffect(() => {
    if (!ref.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: basemapStyle,
      center: [center.lon, center.lat],
      zoom: props.initialZoom ?? 2.5,
      attributionControl: {},
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const onLoad = () => {
      // Facilities
      map.addSource("facilities", { type: "geojson", data: facilitiesFc as any });
      map.addLayer({
        id: "facilities",
        type: "circle",
        source: "facilities",
        paint: {
          "circle-radius": 5,
          "circle-color": "#a78bfa",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#111827",
        },
      });

      // Geofences polygons
      map.addSource("geofences", { type: "geojson", data: geofencesFc as any });
      map.addLayer({
        id: "geofences-fill",
        type: "fill",
        source: "geofences",
        paint: { "fill-color": "#22c55e", "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: "geofences-line",
        type: "line",
        source: "geofences",
        paint: { "line-color": "#22c55e", "line-width": 1.5, "line-opacity": 0.6 },
      });

      // Signals
      map.addSource("signals", { type: "geojson", data: signalsFc as any });
      map.addLayer({
        id: "signals",
        type: "circle",
        source: "signals",
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "case",
            [">=", ["get", "severity"], 5],
            "#ef4444",
            [">=", ["get", "severity"], 4],
            "#f97316",
            [">=", ["get", "severity"], 3],
            "#facc15",
            [">=", ["get", "severity"], 2],
            "#38bdf8",
            "#a1a1aa",
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#0b1220",
          "circle-opacity": 0.9,
        },
      });

      // Evidence (clustered)
      map.addSource("evidence", {
        type: "geojson",
        data: evidenceFc as any,
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 52,
      } as any);

      map.addLayer({
        id: "evidence-clusters",
        type: "circle",
        source: "evidence",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#334155",
            25,
            "#475569",
            100,
            "#64748b",
          ],
          "circle-radius": ["step", ["get", "point_count"], 14, 25, 18, 100, 22],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#0b1220",
        },
      });

      map.addLayer({
        id: "evidence-cluster-count",
        type: "symbol",
        source: "evidence",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#e5e7eb" },
      });

      map.addLayer({
        id: "evidence-unclustered",
        type: "circle",
        source: "evidence",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 4,
          "circle-color": [
            "case",
            ["==", ["get", "triageStatus"], "new"],
            "#22c55e",
            ["==", ["get", "triageStatus"], "triaged"],
            "#a1a1aa",
            "#60a5fa",
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#0b1220",
          "circle-opacity": 0.8,
        },
      });

      // Routes (corridor visualization as a wide line in px; updated on zoom)
      map.addSource("routes", { type: "geojson", data: routesFc as any });
      map.addLayer({
        id: "routes-corridor",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#60a5fa",
          "line-opacity": 0.18,
          "line-width": ["get", "corridorPx"],
        },
      });
      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#60a5fa",
          "line-opacity": 0.85,
          "line-width": 2,
        },
      });

      // Draw layer
      map.addSource("drawLine", { type: "geojson", data: drawLineFc as any });
      map.addLayer({
        id: "draw-line",
        type: "line",
        source: "drawLine",
        paint: { "line-color": "#a78bfa", "line-width": 3, "line-dasharray": [2, 1] },
      });

      // Evidence interactions
      map.on("mouseenter", "evidence-unclustered", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "evidence-unclustered", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("click", "evidence-clusters", (e) => {
        const feats = map.queryRenderedFeatures(e.point, { layers: ["evidence-clusters"] });
        const f = feats?.[0] as any;
        const clusterId = f?.properties?.cluster_id;
        const coords = f?.geometry?.coordinates;
        if (clusterId == null || !coords) return;
        const src: any = map.getSource("evidence");
        if (!src?.getClusterExpansionZoom) return;
        src.getClusterExpansionZoom(clusterId, (err: any, z: number) => {
          if (err) return;
          map.easeTo({ center: coords, zoom: z });
        });
      });
      map.on("click", "evidence-unclustered", (e) => {
        const f = (e.features?.[0] as any) ?? null;
        const id = String(f?.properties?.id ?? "");
        if (!id) return;
        if (props.onEvidenceClick) props.onEvidenceClick(id);
      });
    };

    map.on("load", onLoad);

    const onClick = (e: MapMouseEvent) => {
      if (!props.onMapClick) return;
      const ll: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      props.onMapClick(ll);
    };

    map.on("click", onClick);

    const updateZoom = () => {
      const z = map.getZoom();
      if (Number.isFinite(z)) setZoom(z);
    };
    map.on("zoom", updateZoom);

    const onMoveEnd = () => {
      if (!props.onViewportChange) return;
      const b = map.getBounds();
      props.onViewportChange({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      });
    };
    map.on("moveend", onMoveEnd);

    return () => {
      map.off("click", onClick);
      map.off("zoom", updateZoom);
      map.off("moveend", onMoveEnd);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update dynamic sources when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("facilities") as any;
    if (src) src.setData(facilitiesFc);
  }, [facilitiesFc]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("signals") as any;
    if (src) src.setData(signalsFc);
  }, [signalsFc]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("evidence") as any;
    if (src) src.setData(evidenceFc);
  }, [evidenceFc]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("geofences") as any;
    if (src) src.setData(geofencesFc);
  }, [geofencesFc]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Update corridorPx for each route at current zoom.
    const features = (routesFc as any).features ?? [];
    for (const f of features) {
      const corridorKm = Number(f?.properties?.corridorKm ?? 0);
      const coords: [number, number][] = f?.geometry?.coordinates ?? [];
      const lat = coords.length ? Number(coords[Math.floor(coords.length / 2)][1]) : 0;
      f.properties = {
        ...(f.properties ?? {}),
        corridorPx: clamp(kmToPixelsAtLatZoom(corridorKm, lat, zoom), 2, 80),
      };
    }

    const src = map.getSource("routes") as any;
    if (src) src.setData({ ...(routesFc as any), features });
  }, [routesFc, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("drawLine") as any;
    if (src) src.setData(drawLineFc);
  }, [drawLineFc]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!props.focus) return;
    const { lat, lon, zoom: z } = props.focus;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    map.easeTo({ center: [lon, lat], zoom: typeof z === "number" ? z : map.getZoom() });
  }, [props.focus]);

  return (
    <div className={props.className}>
      <div ref={ref} className="h-[560px] w-full overflow-hidden rounded-2xl border border-zinc-800" />
      <div className="mt-2 text-xs text-zinc-500">
        MapLibre • {props.drawMode ? "Draw mode on" : "Draw mode off"} • zoom {zoom.toFixed(2)}
      </div>
    </div>
  );
}


