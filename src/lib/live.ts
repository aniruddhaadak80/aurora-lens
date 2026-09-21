// AuroraLens live fetchers — NOAA SWPC + USGS, normalized, with sealed offline fallback.
// Shared by REST routes and MCP tools so agents and UI always see identical data.

import { FALLBACK_QUAKES, FALLBACK_SPACE } from "./fallback";
import type { Quake, QuakeFeed, SpaceAlert, SpaceWeather } from "./types";

const TIMEOUT = 9000;

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT),
    next: { revalidate: 300 },
    headers: { "User-Agent": "aurora-lens/1.0 (+github.com/aniruddhaadak80/aurora-lens)" },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

function lastValidRow<T>(rows: T[], pick: (r: T) => boolean): T | null {
  for (let i = rows.length - 1; i >= 0; i--) if (pick(rows[i])) return rows[i];
  return null;
}

export async function getSpaceWeather(): Promise<SpaceWeather> {
  try {
    const [kpRaw, windRaw, magRaw, flaresRaw, alertsRaw] = await Promise.all([
      getJson("https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"),
      getJson("https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json"),
      getJson("https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json"),
      getJson("https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json"),
      getJson("https://services.swpc.noaa.gov/products/alerts.json"),
    ]);

    // Kp — last numeric entry
    const kpArr = Array.isArray(kpRaw) ? kpRaw : [];
    const kpRow = lastValidRow(
      kpArr as Array<Record<string, unknown>>,
      (r) => num(r["kp"]) !== null
    );
    if (!kpRow) throw new Error("no kp rows");

    // Solar wind (DSCOVR/ACE real-time, 1-min cadence)
    const windArr = (Array.isArray(windRaw) ? windRaw : []) as Array<Record<string, unknown>>;
    const wRow = lastValidRow(windArr, (r) => num(r["proton_speed"]) !== null);

    // Interplanetary magnetic field (1-min cadence)
    const magArr = (Array.isArray(magRaw) ? magRaw : []) as Array<Record<string, unknown>>;
    const gRow = lastValidRow(magArr, (r) => num(r["bz_gsm"]) !== null);

    // Flares — most recent first
    const flareArr = (Array.isArray(flaresRaw) ? flaresRaw : []) as Array<Record<string, unknown>>;
    const flares = flareArr.slice(-12).reverse().map((f) => {
      const cls = String(f["class_type"] ?? f["max_class"] ?? "C1.0");
      const m = cls.toUpperCase().match(/^([ABCMX])\s*(\d+(?:\.\d+)?)?/);
      return {
        time: String(f["max_time"] ?? f["begin_time"] ?? f["time_tag"] ?? new Date().toISOString()),
        classType: m ? m[1] : "C",
        magnitude: m?.[2] ? parseFloat(m[2]) : 1,
        region: f["source_location"] != null ? String(f["source_location"]) : null,
      };
    });

    // Alerts — newest first by issue time
    const alertArr = (Array.isArray(alertsRaw) ? alertsRaw : []) as Array<Record<string, unknown>>;
    const sorted = [...alertArr].sort(
      (a, b) => Date.parse(String(b["issue_datetime"] ?? 0)) - Date.parse(String(a["issue_datetime"] ?? 0))
    );
    const alerts: SpaceAlert[] = sorted.slice(0, 10).map((a) => {
      const msg = String(a["message"] ?? "");
      const lines = msg.split("\n").map((l) => l.trim()).filter(Boolean);
      const headline =
        lines.find((l) => /warning|watch|alert/i.test(l)) ?? lines[0] ?? "Space weather alert";
      const rawTime = String(a["issue_datetime"] ?? "");
      const parsed = new Date(rawTime.includes("T") ? rawTime : `${rawTime.replace(" ", "T")}Z`);
      return {
        time: Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
        kind: headline.slice(0, 80),
        message: msg.slice(0, 600),
      };
    });

    const now = new Date().toISOString();
    if (!wRow && !gRow) throw new Error("no solar wind rows");
    return {
      kp: {
        time: String(kpRow["time_tag"] ?? now),
        kp: num(kpRow["kp"]),
        source: "live",
      },
      wind: {
        time: String((wRow ?? gRow)?.["time_tag"] ?? now),
        speed: wRow ? num(wRow["proton_speed"]) : null,
        density: wRow ? num(wRow["proton_density"]) : null,
        temperature: wRow ? num(wRow["proton_temperature"]) : null,
        bz: gRow ? num(gRow["bz_gsm"]) : null,
        bt: gRow ? num(gRow["bt"]) : null,
        source: "live",
      },
      flares,
      alerts,
      source: "live",
      fetchedAt: now,
    };
  } catch {
    return { ...FALLBACK_SPACE, fetchedAt: new Date().toISOString() };
  }
}

export async function getQuakes(): Promise<QuakeFeed> {
  try {
    const raw = (await getJson(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
    )) as { features?: Array<{ id?: unknown; properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } | null }> };
    const feats = Array.isArray(raw.features) ? raw.features : [];
    if (feats.length === 0) throw new Error("no quake features");
    const quakes: Quake[] = feats.map((f) => {
      const p = f["properties"] ?? {};
      const g = f["geometry"] as { coordinates?: number[] } | null;
      const c = g?.coordinates ?? [0, 0, 0];
      return {
        id: String(f["id"] ?? Math.random().toString(36)),
        mag: num(p["mag"]) ?? 0,
        place: String(p["place"] ?? "Unknown location"),
        time: new Date(num(p["time"]) ?? Date.now()).toISOString(),
        lat: c[1] ?? 0,
        lon: c[0] ?? 0,
        depth: c[2] ?? 0,
        url: String(p["url"] ?? "https://earthquake.usgs.gov/"),
      };
    });
    quakes.sort((a, b) => b.mag - a.mag);
    return {
      quakes: quakes.slice(0, 100),
      count: quakes.length,
      maxMag: quakes[0]?.mag ?? null,
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return { ...FALLBACK_QUAKES, fetchedAt: new Date().toISOString() };
  }
}
