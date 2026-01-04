import { describe, expect, it } from "vitest";

import { pointToPolylineDistanceKm, routeFromMetadata, scoreFromRouteTags } from "./evaluateSignal.js";

describe("route corridor helpers", () => {
  it("routeFromMetadata parses a LineString + clamps corridorKm", () => {
    const ok = routeFromMetadata({
      routeGeometry: { type: "LineString", coordinates: [[0, 0], [1, 0]] },
      corridorKm: 12,
    });
    expect(ok).toEqual({ coords: [[0, 0], [1, 0]], corridorKm: 12 });

    const clamped = routeFromMetadata({
      routeGeometry: { type: "LineString", coordinates: [[0, 0], [1, 0]] },
      corridorKm: -5,
    });
    expect(clamped?.corridorKm).toBe(0.1);

    const bad = routeFromMetadata({ routeGeometry: { type: "Point", coordinates: [0, 0] } });
    expect(bad).toBeNull();
  });

  it("pointToPolylineDistanceKm is ~0 for a point on the line and ~111km for 1° latitude offset", () => {
    const coords: [number, number][] = [
      [0, 0],
      [1, 0],
    ];

    const onLine = pointToPolylineDistanceKm({ lat: 0, lon: 0.5 }, coords);
    expect(onLine.segmentIndex).toBe(0);
    expect(onLine.distanceKm).toBeLessThan(0.01);

    const north = pointToPolylineDistanceKm({ lat: 1, lon: 0.5 }, coords);
    expect(north.segmentIndex).toBe(0);
    expect(north.distanceKm).toBeGreaterThan(100);
    expect(north.distanceKm).toBeLessThan(125);
  });

  it("scoreFromRouteTags recognizes transportation/security tags", () => {
    const r = scoreFromRouteTags(["cargo_theft", "protest"]);
    expect(r.score).toBeGreaterThan(0);
    expect(r.reasons.join(" ")).toMatch(/cargo|protest/i);
  });
});


