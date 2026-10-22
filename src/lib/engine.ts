// AuroraLens engine — deterministic, explainable, keyless storm scoring + hash-chained seals.
// The SAME functions serve the UI, the REST API (/api/assessment) and the MCP tools.
// No ML, no API keys: every factor is itemized so an operator or agent can audit the score.

import type {
  FeedSource,
  SealedAssessment,
  StormAssessment,
  StormFactor,
  StormLevel,
} from "./types";

export interface EngineInput {
  kp: number | null;
  solarWindSpeed: number | null; // km/s
  bz: number | null; // nT GSM
  maxFlare: string | null; // e.g. "M2.4" or "C7.1"
  alertCount: number;
  maxQuake: number | null;
  source: FeedSource;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Map an X-ray flare class string ("M2.4") to 0-100 sub-points. */
export function flareToPoints(flare: string | null): { points: number; label: string } {
  if (!flare) return { points: 0, label: "none observed" };
  const m = flare.trim().toUpperCase().match(/^([ABCMX])\s*(\d+(?:\.\d+)?)?/);
  if (!m) return { points: 0, label: flare };
  const cls = m[1];
  const mag = m[2] ? parseFloat(m[2]) : 1;
  const base: Record<string, number> = { A: 2, B: 8, C: 28, M: 62, X: 92 };
  const frac = clamp(mag / 9, 0, 1) * 8;
  return { points: round1(clamp((base[cls] ?? 0) + frac)), label: flare.trim().toUpperCase() };
}

export function levelFor(score: number): StormLevel {
  if (score >= 80) return "Severe";
  if (score >= 65) return "Storm";
  if (score >= 45) return "Active";
  if (score >= 25) return "Unsettled";
  return "Quiet";
}

export function assessStorm(input: EngineInput): StormAssessment {
  const factors: StormFactor[] = [];

  const kpPts = input.kp == null ? 0 : round1(clamp((input.kp / 9) * 100));
  factors.push({
    name: "Planetary K-index",
    display: input.kp == null ? "Kp —" : `Kp ${input.kp.toFixed(2)}`,
    points: kpPts,
    weight: 0.3,
    contribution: round1(kpPts * 0.3),
    detail: "Kp 0-9 linearly scaled. Kp≥5 is NOAA G1 storm threshold.",
  });

  const spd = input.solarWindSpeed;
  const spdPts = spd == null ? 0 : round1(clamp(((spd - 300) / (800 - 300)) * 100));
  factors.push({
    name: "Solar wind speed",
    display: spd == null ? "— km/s" : `${Math.round(spd)} km/s`,
    points: spdPts,
    weight: 0.2,
    contribution: round1(spdPts * 0.2),
    detail: "300 km/s = calm baseline, 800 km/s = extreme driver.",
  });

  const bz = input.bz;
  const bzPts = bz == null ? 0 : round1(clamp((-bz / 20) * 100));
  factors.push({
    name: "IMF Bz (southward)",
    display: bz == null ? "Bz —" : `Bz ${bz.toFixed(1)} nT`,
    points: bzPts,
    weight: 0.2,
    contribution: round1(bzPts * 0.2),
    detail: "Southward Bz (negative) reconnects with Earth's field. -20 nT = full points.",
  });

  const flare = flareToPoints(input.maxFlare);
  factors.push({
    name: "Strongest flare",
    display: flare.label,
    points: flare.points,
    weight: 0.15,
    contribution: round1(flare.points * 0.15),
    detail: "GOES X-ray class: A/B background, C minor, M radio-blackout risk, X extreme.",
  });

  const alertPts = round1(clamp((Math.max(0, input.alertCount) / 10) * 100));
  factors.push({
    name: "Active SWPC alerts",
    display: `${input.alertCount} active`,
    points: alertPts,
    weight: 0.1,
    contribution: round1(alertPts * 0.1),
    detail: "Count of live NOAA watches/warnings, capped at 10.",
  });

  const mq = input.maxQuake;
  const qPts = mq == null ? 0 : round1(clamp(((mq - 4.5) / (8 - 4.5)) * 100));
  factors.push({
    name: "Seismic context",
    display: mq == null ? "M —" : `M${mq.toFixed(1)} max`,
    points: qPts,
    weight: 0.05,
    contribution: round1(qPts * 0.05),
    detail: "Largest M4.5+ quake in 24h. Context only — quakes do not cause storms.",
  });

  const score = round1(factors.reduce((s, f) => s + f.contribution, 0));
  return {
    score,
    level: levelFor(score),
    factors,
    inputs: {
      kp: input.kp,
      solarWindSpeed: input.solarWindSpeed,
      bz: input.bz,
      maxFlare: input.maxFlare,
      alertCount: input.alertCount,
      maxQuake: input.maxQuake,
    },
    generatedAt: new Date().toISOString(),
    source: input.source,
  };
}

export function strongestFlare(flares: Array<{ classType: string; magnitude: number }>): string | null {
  let best: string | null = null;
  let bestPts = -1;
  for (const f of flares.slice(0, 15)) {
    const label = `${f.classType}${f.magnitude}`;
    const pts = flareToPoints(label).points;
    if (pts > bestPts) {
      bestPts = pts;
      best = label;
    }
  }
  return best;
}

// ---------- Integrity: hash-chained audit seals ----------
// seal = SHA-384( prevSeal ‖ canonicalJson(assessment) )
// canonicalJson sorts object keys recursively so any client can replay the seal.

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const body = keys
    .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
    .join(",");
  return `{${body}}`;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha384Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-384", data);
  return bytesToHex(digest);
}

/** Daily chain anchor — deterministic per UTC date so seals verify without server state. */
export async function dayGenesis(date = new Date()): Promise<string> {
  const day = date.toISOString().slice(0, 10);
  return sha384Hex(`AURORA-LENS-GENESIS:${day}`);
}

export async function sealAssessment(
  assessment: StormAssessment,
  prevSeal?: string
): Promise<SealedAssessment> {
  const { ...rest } = assessment;
  const canonical = canonicalJson(rest);
  const prev = prevSeal ?? (await dayGenesis(new Date(assessment.generatedAt)));
  const seal = await sha384Hex(`${prev}${canonical}`);
  return { ...assessment, prevSeal: prev, seal, canonical };
}

export async function verifyChain(records: SealedAssessment[]): Promise<{
  ok: boolean;
  checked: number;
  failedIndex: number | null;
}> {
  for (let i = 0; i < records.length; i++) {
    const r = records[i] as SealedAssessment & { context?: unknown };
    // `context` is unsealed response metadata (counts, timestamps) — excluded from the replay.
    const { prevSeal, seal, canonical: _c, context: _ctx, ...rest } = r;
    void _c;
    void _ctx;
    if (i === 0) {
      // Anchor the first record to the daily genesis, otherwise the head of
      // the chain could be replaced wholesale with a self-consistent forgery.
      const expectedGenesis = await dayGenesis(new Date(r.generatedAt));
      if (prevSeal !== expectedGenesis) {
        return { ok: false, checked: 1, failedIndex: 0 };
      }
    }
    const recomputed = await sha384Hex(`${prevSeal}${canonicalJson(rest)}`);
    if (recomputed !== seal) return { ok: false, checked: i + 1, failedIndex: i };
    if (i === 0) {
      const anchor = await dayGenesis(new Date((rest as { generatedAt?: string }).generatedAt ?? new Date()));
      if (prevSeal !== anchor) return { ok: false, checked: i + 1, failedIndex: i };
    } else if (prevSeal !== records[i - 1].seal) {
      return { ok: false, checked: i + 1, failedIndex: i };
    }
  }
  return { ok: true, checked: records.length, failedIndex: null };
}

/**
 * The strongest flare in a window of recent flares.
 *
 * Shared by the REST route and the MCP tool so both surfaces score the same
 * live data identically.
 */
export function strongestFlare(
  flares: Array<{ classType: string; magnitude: number }>,
  window = 15
): string | null {
  let best: string | null = null;
  let bestPts = -1;
  for (const f of flares.slice(0, window)) {
    const label = `${f.classType}${f.magnitude}`;
    const pts = flareToPoints(label).points;
    if (pts > bestPts) {
      bestPts = pts;
      best = label;
    }
  }
  return best;
}
