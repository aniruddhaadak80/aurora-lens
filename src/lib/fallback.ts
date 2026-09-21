// AuroraLens — sealed offline fallback samples.
// Guarantees first paint, build and demo never break without network.
// Shapes mirror src/lib/types.ts exactly.

import type { QuakeFeed, SpaceWeather } from "./types";

export const FALLBACK_SPACE: SpaceWeather = {
  kp: { time: "2026-09-21T00:00:00Z", kp: 4.33, source: "fallback" },
  wind: {
    time: "2026-09-21T00:00:00Z",
    speed: 512,
    density: 8.4,
    temperature: 142000,
    bz: -6.2,
    bt: 9.8,
    source: "fallback",
  },
  flares: [
    { time: "2026-09-20T14:12:00Z", classType: "M", magnitude: 2.4, region: "AR 4211" },
    { time: "2026-09-19T09:47:00Z", classType: "C", magnitude: 7.1, region: "AR 4209" },
    { time: "2026-09-18T22:03:00Z", classType: "B", magnitude: 8.3, region: null },
  ],
  alerts: [
    {
      time: "2026-09-20T18:00:00Z",
      kind: "Geomagnetic Watch G2",
      message: "G2 (Moderate) geomagnetic storm watch in effect; aurora possible to mid-latitudes.",
    },
    {
      time: "2026-09-19T11:30:00Z",
      kind: "Radio Blackout R1",
      message: "R1 radio blackout from M-class flare; HF degradation on dayside.",
    },
  ],
  source: "fallback",
  fetchedAt: "2026-09-21T00:00:00Z",
};

export const FALLBACK_QUAKES: QuakeFeed = {
  quakes: [
    { id: "fallback-1", mag: 6.1, place: "South of the Fiji Islands", time: "2026-09-20T21:14:00Z", lat: -25.4, lon: 179.6, depth: 520, url: "https://earthquake.usgs.gov/" },
    { id: "fallback-2", mag: 5.4, place: "Off the coast of Honshu, Japan", time: "2026-09-20T12:02:00Z", lat: 38.2, lon: 142.1, depth: 44, url: "https://earthquake.usgs.gov/" },
    { id: "fallback-3", mag: 5.1, place: "Drake Passage", time: "2026-09-19T23:40:00Z", lat: -59.7, lon: -63.2, depth: 12, url: "https://earthquake.usgs.gov/" },
    { id: "fallback-4", mag: 4.9, place: "Hindu Kush, Afghanistan", time: "2026-09-19T08:15:00Z", lat: 36.4, lon: 70.9, depth: 190, url: "https://earthquake.usgs.gov/" },
    { id: "fallback-5", mag: 4.7, place: "Reykjanes Ridge", time: "2026-09-18T16:52:00Z", lat: 52.8, lon: -33.4, depth: 10, url: "https://earthquake.usgs.gov/" },
    { id: "fallback-6", mag: 4.6, place: "Banda Sea", time: "2026-09-18T03:11:00Z", lat: -6.2, lon: 130.4, depth: 140, url: "https://earthquake.usgs.gov/" },
  ],
  count: 6,
  maxMag: 6.1,
  source: "fallback",
  fetchedAt: "2026-09-21T00:00:00Z",
};
