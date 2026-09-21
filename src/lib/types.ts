// AuroraLens — normalized live-data types.
// Every external feed is normalized into these shapes so UI, REST API and MCP tools share one contract.

export type FeedSource = "live" | "fallback";

export interface KpReading {
  time: string;
  kp: number | null;
  source: FeedSource;
}

export interface SolarWind {
  time: string;
  speed: number | null; // km/s
  density: number | null; // p/cm^3
  temperature: number | null; // K
  bz: number | null; // nT (GSM, southward < 0 drives storms)
  bt: number | null; // nT total field
  source: FeedSource;
}

export interface FlareEvent {
  time: string;
  classType: string; // A | B | C | M | X
  magnitude: number; // e.g. 2.4 for M2.4
  region: string | null;
}

export interface SpaceAlert {
  time: string;
  kind: string;
  message: string;
}

export interface SpaceWeather {
  kp: KpReading;
  wind: SolarWind;
  flares: FlareEvent[];
  alerts: SpaceAlert[];
  source: FeedSource;
  fetchedAt: string;
}

export interface Quake {
  id: string;
  mag: number;
  place: string;
  time: string;
  lat: number;
  lon: number;
  depth: number;
  url: string;
}

export interface QuakeFeed {
  quakes: Quake[];
  count: number;
  maxMag: number | null;
  source: FeedSource;
  fetchedAt: string;
}

export interface StormFactor {
  name: string;
  display: string;
  points: number; // 0-100 sub-score
  weight: number; // sums to 1
  contribution: number; // points * weight
  detail: string;
}

export type StormLevel = "Quiet" | "Unsettled" | "Active" | "Storm" | "Severe";

export interface StormAssessment {
  score: number; // 0-100
  level: StormLevel;
  factors: StormFactor[];
  inputs: {
    kp: number | null;
    solarWindSpeed: number | null;
    bz: number | null;
    maxFlare: string | null;
    alertCount: number;
    maxQuake: number | null;
  };
  generatedAt: string;
  source: FeedSource;
}

export interface SealedAssessment extends StormAssessment {
  prevSeal: string;
  seal: string;
  canonical: string;
}

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}
