// AuroraLens MCP endpoint — JSON-RPC 2.0 over HTTP (Streamable-HTTP style).
// Methods: initialize, tools/list, tools/call.
// Tools: get_space_weather, get_quakes, assess_storm, verify_seal.

import { assessStorm, sealAssessment, verifyChain } from "@/lib/engine";
import { getQuakes, getSpaceWeather } from "@/lib/live";
import type { McpToolDef } from "@/lib/types";

export const revalidate = 0;

const SERVER_INFO = {
  name: "aurora-lens",
  version: "1.0.0",
  protocolVersion: "2025-06-18",
  description: "Live solar-storm + seismic ops globe: space weather, quakes, deterministic storm scores with hash-chained seals.",
};

const TOOLS: McpToolDef[] = [
  {
    name: "get_space_weather",
    description: "Latest NOAA SWPC readings: planetary Kp, solar wind (speed/density/Bz/Bt), X-ray flares, active alerts.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_quakes",
    description: "Latest USGS M4.5+ earthquakes (24h): magnitude, place, lat/lon, depth.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "assess_storm",
    description: "Deterministic geomagnetic storm score 0-100 with itemized factors + SHA-384 audit seal. Omit args to use live feeds.",
    inputSchema: {
      type: "object",
      properties: {
        kp: { type: ["number", "null"], description: "Planetary K-index 0-9" },
        solarWindSpeed: { type: ["number", "null"], description: "Solar wind speed km/s" },
        bz: { type: ["number", "null"], description: "IMF Bz nT (negative = southward)" },
        maxFlare: { type: ["string", "null"], description: "Strongest flare, e.g. M2.4" },
        alertCount: { type: "number", description: "Active alert count" },
        maxQuake: { type: ["number", "null"], description: "Largest quake magnitude" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "verify_seal",
    description: "Replay-verify hash-chained audit seals: SHA-384(prevSeal ‖ canonicalJson).",
    inputSchema: {
      type: "object",
      properties: { records: { type: "array", description: "SealedAssessment records to verify" } },
      required: ["records"],
    },
  },
];

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function ok(id: RpcRequest["id"], result: unknown) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function err(id: RpcRequest["id"], code: number, message: string) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

export async function GET() {
  return Response.json({ ...SERVER_INFO, tools: TOOLS.map((t) => t.name) });
}

export async function POST(req: Request) {
  let rpc: RpcRequest;
  try {
    rpc = (await req.json()) as RpcRequest;
  } catch {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } },
      { status: 400 }
    );
  }
  const id = rpc.id ?? null;
  const method = rpc.method ?? "";
  const params = rpc.params ?? {};

  if (method === "initialize") {
    return ok(id, { ...SERVER_INFO, capabilities: { tools: {} } });
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = params["name"];
    const args = (params["arguments"] as Record<string, unknown> | undefined) ?? {};
    try {
      if (name === "get_space_weather") return ok(id, { content: [await getSpaceWeather()] });
      if (name === "get_quakes") return ok(id, { content: [await getQuakes()] });
      if (name === "assess_storm") {
        const hasArgs = Object.keys(args).length > 0;
        let input;
        if (hasArgs) {
          input = {
            kp: (args["kp"] as number | null) ?? null,
            solarWindSpeed: (args["solarWindSpeed"] as number | null) ?? null,
            bz: (args["bz"] as number | null) ?? null,
            maxFlare: (args["maxFlare"] as string | null) ?? null,
            alertCount: Number(args["alertCount"] ?? 0),
            maxQuake: (args["maxQuake"] as number | null) ?? null,
            source: "live" as const,
          };
        } else {
          const [space, quakes] = await Promise.all([getSpaceWeather(), getQuakes()]);
          const fl = space.flares[0];
          input = {
            kp: space.kp.kp,
            solarWindSpeed: space.wind.speed,
            bz: space.wind.bz,
            maxFlare: fl ? `${fl.classType}${fl.magnitude}` : null,
            alertCount: space.alerts.length,
            maxQuake: quakes.maxMag,
            source: space.source === "live" ? ("live" as const) : ("fallback" as const),
          };
        }
        const sealed = await sealAssessment(assessStorm(input));
        return ok(id, { content: [sealed] });
      }
      if (name === "verify_seal") {
        const records = args["records"] as Parameters<typeof verifyChain>[0];
        if (!Array.isArray(records)) return err(id, -32602, "records must be an array");
        return ok(id, await verifyChain(records));
      }
      return err(id, -32601, `unknown tool: ${String(name)}`);
    } catch (e) {
      return err(id, -32603, e instanceof Error ? e.message : "tool failed");
    }
  }

  return err(id, -32601, `unknown method: ${method}`);
}
