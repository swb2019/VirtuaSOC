import { describe, expect, it } from "vitest";

import { geoFromItem, parseGeoPoint, tagsFromCategories } from "./rss.js";

describe("rss geo helpers", () => {
  it("parseGeoPoint supports GeoRSS 'lat lon' and 'lat,lon'", () => {
    expect(parseGeoPoint("38.8977 -77.0365")).toEqual({ lat: 38.8977, lon: -77.0365 });
    expect(parseGeoPoint("38.8977,-77.0365")).toEqual({ lat: 38.8977, lon: -77.0365 });
    expect(parseGeoPoint("999 0")).toBeNull();
  });

  it("geoFromItem prefers georss:point then geo:lat/long", () => {
    const g1 = geoFromItem({ "georss:point": "38.8977 -77.0365", "geo:lat": "1", "geo:long": "2" });
    expect(g1).toEqual({ geo: { lat: 38.8977, lon: -77.0365 }, source: "georss:point" });

    const g2 = geoFromItem({ "geo:lat": "38.8977", "geo:long": "-77.0365" });
    expect(g2).toEqual({ geo: { lat: 38.8977, lon: -77.0365 }, source: "geo:lat/long" });
  });

  it("tagsFromCategories normalizes and filters to allowed tags", () => {
    const tags = tagsFromCategories(["Protests", "Shooting", "Random Stuff", "Cargo Theft"]);
    expect(tags).toEqual(expect.arrayContaining(["protest", "shooting", "cargo_theft"]));
    expect(tags).not.toEqual(expect.arrayContaining(["random_stuff"]));
  });
});


