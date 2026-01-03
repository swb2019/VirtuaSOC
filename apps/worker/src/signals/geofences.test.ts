import { describe, expect, it } from "vitest";

import { geoFromMetadata, haversineKm, scoreFromDistanceKm, scoreFromFacilityReputationTags } from "./evaluateSignal.js";

describe("geofences helpers", () => {
  it("geoFromMetadata reads geo from nested raw payloads (webhook-style)", () => {
    const meta = {
      source: { type: "webhook" },
      raw: { lat: 38.8977, lon: -77.0365 },
    };
    expect(geoFromMetadata(meta)).toEqual({ lat: 38.8977, lon: -77.0365 });
  });

  it("haversineKm is roughly correct for 1 degree of longitude at equator (~111km)", () => {
    const km = haversineKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 });
    expect(km).toBeGreaterThan(100);
    expect(km).toBeLessThan(120);
  });

  it("scoreFromDistanceKm uses tighter bands for close proximity", () => {
    expect(scoreFromDistanceKm(0.5).score).toBeGreaterThan(scoreFromDistanceKm(6).score);
    expect(scoreFromDistanceKm(6).score).toBeGreaterThan(scoreFromDistanceKm(30).score);
  });

  it("scoreFromFacilityReputationTags recognizes facility/reputation tags", () => {
    const r = scoreFromFacilityReputationTags(["protest", "activism", "negative_media"]);
    expect(r.score).toBeGreaterThan(0);
    expect(r.reasons.join(" ")).toMatch(/protest|activism|reputation/i);
  });
});


