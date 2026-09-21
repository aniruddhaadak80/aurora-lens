<div align="center">

# 🌌 AuroraLens

**The Sun is shouting. AuroraLens listens — live solar-storm + seismic ops on a 3D planet, for humans *and* agents.**

[![Live Demo](https://img.shields.io/badge/demo-live-22d3ee?style=for-the-badge)](https://aurora-lens-ruddy.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-34d399?style=for-the-badge)](./LICENSE)
[![Next.js](https://img.shields.io/badge/next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Feeds: NOAA + USGS](https://img.shields.io/badge/feeds-NOAA_%2B_USGS-fbbf24?style=for-the-badge)](https://aurora-lens-ruddy.vercel.app/api/health)
[![MCP ready](https://img.shields.io/badge/MCP-JSON--RPC-a78bfa?style=for-the-badge)](https://aurora-lens-ruddy.vercel.app/api/mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/aniruddhaadak80/aurora-lens/ci.yml?style=for-the-badge&label=ci)](https://github.com/aniruddhaadak80/aurora-lens/actions)

[Live App](https://aurora-lens-ruddy.vercel.app) · [API](https://aurora-lens-ruddy.vercel.app/api/health) · [MCP](https://aurora-lens-ruddy.vercel.app/api/mcp) · [Issues](https://github.com/aniruddhaadak80/aurora-lens/issues)

</div>

> ⚠️ **Safety note:** AuroraLens is an educational dashboard, not an operational warning
> system. For grid, aviation or satellite decisions, always consult official
> [NOAA SWPC](https://www.swpc.noaa.gov/) alerts directly.

## ✨ Features

- 🛰️ **Live planetary feeds** — NOAA SWPC (Kp, solar wind, X-ray flares, alerts) + USGS M4.5+ quakes, cached API routes, sealed offline fallbacks
- 🧮 **Deterministic storm engine** — 0–100 score from 6 itemized factors; same function serves UI, REST and MCP
- 🤖 **MCP agent interface** — JSON-RPC `initialize` / `tools/list` / `tools/call` + live in-page console
- 🔗 **Hash-chained seals** — `SHA-384(prevSeal ‖ canonicalJson)` on every assessment, replay-verifiable
- 🌍 **Library-grade 3D** — `react-globe.gl` night-earth with quake points, storm arcs, auroral rings, pause-on-drag auto-rotate
- 📡 **Zero keys, zero setup** — clone → install → dev, works offline on first paint

## 🏗️ System architecture

```mermaid
flowchart LR
    SWPC[("NOAA SWPC<br/>Kp · wind · flares · alerts")]:::cyan
    USGS[("USGS<br/>M4.5+ quakes")]:::cyan
    API["Next.js API routes<br/>revalidate cache"]:::slate
    FALL["Sealed fallbacks<br/>offline samples"]:::amber
    ENG["Storm engine<br/>6 weighted factors"]:::violet
    SEAL["Seal chain<br/>SHA-384"]:::emerald
    UI["Dashboard UI<br/>hero · gauge · globe"]:::cyan
    MCP["MCP endpoint<br/>JSON-RPC tools"]:::emerald
    AG["Coding agents<br/>Claude · Codex · goose"]:::emerald
    SWPC --> API
    USGS --> API
    FALL --> API
    API --> ENG
    ENG --> SEAL
    SEAL --> UI
    SEAL --> MCP
    MCP --> AG
    classDef cyan fill:#22d3ee,color:#04060c;
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef amber fill:#fbbf24,color:#04060c;
    classDef slate fill:#94a3b8,color:#04060c;
```

## 🚰 Data-pipeline flow

```mermaid
flowchart TB
    POLL["Route handler<br/>revalidate 120–300s"]:::slate
    FETCH["Parallel upstream fetch<br/>5 NOAA + 1 USGS endpoints"]:::cyan
    NORM["Normalize<br/>shared TypeScript contract"]:::cyan
    OK{"All feeds OK?"}:::amber
    LIVE["Tag source = live"]:::emerald
    BACK["Swap sealed fallback samples"]:::amber
    OUT["JSON response<br/>+ fetchedAt + source tag"]:::cyan
    POLL --> FETCH
    FETCH --> NORM
    NORM --> OK
    OK -->|yes| LIVE
    OK -->|no| BACK
    LIVE --> OUT
    BACK --> OUT
    classDef cyan fill:#22d3ee,color:#04060c;
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef amber fill:#fbbf24,color:#04060c;
    classDef slate fill:#94a3b8,color:#04060c;
```

## 🧮 Engine / algorithm flow

```mermaid
flowchart LR
    KP["Kp 0–9<br/>w 0.30"]:::violet
    SPD["Wind speed<br/>w 0.20"]:::violet
    BZ["Bz southward<br/>w 0.20"]:::violet
    FL["Flare class<br/>w 0.15"]:::rose
    AL["Alert count<br/>w 0.10"]:::amber
    QK["Quake context<br/>w 0.05"]:::slate
    SUM["Weighted sum<br/>0–100"]:::violet
    LVL["Level<br/>Quiet→Severe"]:::emerald
    KP --> SUM
    SPD --> SUM
    BZ --> SUM
    FL --> SUM
    AL --> SUM
    QK --> SUM
    SUM --> LVL
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef amber fill:#fbbf24,color:#04060c;
    classDef rose fill:#fb7185,color:#04060c;
    classDef slate fill:#94a3b8,color:#04060c;
```

Factor reference: Kp linear 0–9 · wind 300→800 km/s · Bz 0→−20 nT · flare A/B/C/M/X mapped 2/8/28/62/92 + magnitude fraction · alerts capped at 10 · quakes M4.5→M8 context only (quakes never *cause* storms).

## 🤖 Agent (MCP) sequence

```mermaid
sequenceDiagram
    participant Agent as Coding agent
    participant MCP as /api/mcp
    participant Live as Feed routes
    participant Eng as Storm engine
    Agent->>MCP: initialize
    MCP-->>Agent: server info + protocol
    Agent->>MCP: tools/list
    MCP-->>Agent: get_space_weather · get_quakes · assess_storm · verify_seal
    Agent->>MCP: tools/call assess_storm {}
    MCP->>Live: getSpaceWeather + getQuakes
    Live-->>MCP: normalized feeds
    MCP->>Eng: assessStorm → sealAssessment
    Eng-->>MCP: score + factors + seal
    MCP-->>Agent: JSON-RPC result
```

## 🔗 Integrity / seal chain

```mermaid
flowchart TB
    GEN["Daily genesis<br/>SHA-384 date anchor"]:::slate
    C1["Canonical JSON<br/>sorted keys, record 1"]:::cyan
    S1["seal₁ = SHA-384<br/>genesis ‖ canonical₁"]:::emerald
    C2["Canonical JSON<br/>record 2"]:::cyan
    S2["seal₂ = SHA-384<br/>seal₁ ‖ canonical₂"]:::emerald
    VER["POST /api/verify<br/>replay → ok:true"]:::violet
    GEN --> S1
    C1 --> S1
    S1 --> S2
    C2 --> S2
    S2 --> VER
    classDef cyan fill:#22d3ee,color:#04060c;
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef amber fill:#fbbf24,color:#04060c;
    classDef slate fill:#94a3b8,color:#04060c;
```

## 🚀 Quickstart

```bash
git clone https://github.com/aniruddhaadak80/aurora-lens
cd aurora-lens
npm install
npm run dev     # → http://localhost:3000
```

Zero env vars. No keys. Works offline.

## 🔌 API

```bash
# Health
curl -s https://aurora-lens-ruddy.vercel.app/api/health

# Live space weather (Kp · wind · flares · alerts)
curl -s https://aurora-lens-ruddy.vercel.app/api/space-weather | head -c 400

# Quakes (M4.5+, 24h)
curl -s https://aurora-lens-ruddy.vercel.app/api/quakes | head -c 400

# Sealed storm assessment (score + factors + SHA-384 seal)
curl -s https://aurora-lens-ruddy.vercel.app/api/assessment | head -c 600

# MCP tools/list
curl -s -X POST https://aurora-lens-ruddy.vercel.app/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# MCP assess_storm via live feeds
curl -s -X POST https://aurora-lens-ruddy.vercel.app/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"assess_storm","arguments":{}}}'

# Verify a seal chain
curl -s -X POST https://aurora-lens-ruddy.vercel.app/api/verify \
  -H 'content-type: application/json' \
  -d '{"records":[<sealed-assessment>]}'
```

### Agent setup (`mcp.json`)

```json
{
  "mcpServers": {
    "aurora-lens": {
      "url": "https://aurora-lens-ruddy.vercel.app/api/mcp",
      "transport": "streamable-http"
    }
  }
}
```

Tools: `get_space_weather` · `get_quakes` · `assess_storm` · `verify_seal`. A ready-made file lives at [`public/mcp.json`](./public/mcp.json).

## 🧭 User-journey flow

```mermaid
flowchart LR
    LAND["Land on hero<br/>live stats + ticker"]:::cyan
    SCORE["Read storm score<br/>itemized factors"]:::violet
    GLOBE["Spin the planet<br/>quakes + auroral rings"]:::cyan
    CONSOLE["Run MCP demo<br/>one click"]:::emerald
    VERIFY["Copy seal → verify<br/>trust the chain"]:::emerald
    STAR["Star + fork<br/>join the mission"]:::amber
    LAND --> SCORE
    SCORE --> GLOBE
    GLOBE --> CONSOLE
    CONSOLE --> VERIFY
    VERIFY --> STAR
    classDef cyan fill:#22d3ee,color:#04060c;
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef amber fill:#fbbf24,color:#04060c;
```

## 📁 Project map

```text
src/
  app/
    page.tsx              # narrative page: 01 LIVE → 05 INTEGRITY
    layout.tsx            # full SEO/OG metadata
    api/
      health/route.ts     # service + endpoint index
      space-weather/      # NOAA SWPC normalizer (cached, fallback-sealed)
      quakes/             # USGS normalizer (cached, fallback-sealed)
      assessment/         # engine + seal over live feeds
      verify/             # seal-chain replay
      mcp/                # JSON-RPC initialize/tools/list/tools/call
  lib/
    types.ts              # one contract for UI + REST + MCP
    live.ts               # upstream fetchers
    fallback.ts           # sealed offline samples
    engine.ts             # deterministic scorer + SHA-384 seals
  components/
    StormGlobe.tsx        # react-globe.gl, client-only, canvas fallback
    GlobeSection.tsx      # ssr:false boundary (Next 16 rule)
    ScoreGauge.tsx        # animated score ring + factor bars
    McpConsole.tsx        # live in-page agent console
    Ticker.tsx            # live marquee
public/mcp.json           # drop-in agent config
```

## 🚢 Deployment pipeline

```mermaid
flowchart TB
    PUSH["git push main"]:::slate
    CI["GitHub Actions CI<br/>node 22 · lint · build"]:::cyan
    MERGE{"CI green?"}:::amber
    VERCEL["Vercel prod deploy<br/>auto-redeploy on push"]:::violet
    CHECKS["HTTP verify<br/>/ · health · feeds · MCP · seal"]:::emerald
    LIVE["Live on aurora-lens.vercel.app"]:::emerald
    PUSH --> CI
    CI --> MERGE
    MERGE -->|yes| VERCEL
    MERGE -->|no| PUSH
    VERCEL --> CHECKS
    CHECKS --> LIVE
    classDef cyan fill:#22d3ee,color:#04060c;
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef amber fill:#fbbf24,color:#04060c;
    classDef slate fill:#94a3b8,color:#04060c;
```

## 🗺️ Roadmap

### Now — *make the wow undeniable*

- [ ] Aurora-oval probability layer on the globe → visitors *see* tonight's aurora zone
- [ ] Flare timeline scrubber → replay the last 7 days of solar anger
- [ ] Submit to MCP directories (Smithery, PulseMCP, mcp.so) → agents discover AuroraLens

```mermaid
flowchart LR
    OVAL["Aurora oval<br/>ovation feed"]:::cyan
    SCRUB["Flare scrubber<br/>7-day replay"]:::violet
    DIRS["MCP directories<br/>Smithery · Pulse"]:::emerald
    WOW["10s wow<br/>locked in"]:::amber
    OVAL --> WOW
    SCRUB --> WOW
    DIRS --> WOW
    classDef cyan fill:#22d3ee,color:#04060c;
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef amber fill:#fbbf24,color:#04060c;
```

### Next — *become infrastructure*

- [ ] WebSocket tick stream (`/api/stream`) → dashboards embed live scores
- [ ] Per-grid-zone impact briefs → operators get actionable text, not just numbers
- [ ] Historical storm archive + comparisons (2003 Halloween, 2024 Gannon) → context goes viral

```mermaid
flowchart LR
    WS["Tick stream<br/>live sockets"]:::cyan
    ZONES["Grid-zone briefs<br/>operator text"]:::rose
    ARCH["Storm archive<br/>legendary events"]:::violet
    INFRA["AuroraLens<br/>as infrastructure"]:::emerald
    WS --> INFRA
    ZONES --> INFRA
    ARCH --> INFRA
    classDef cyan fill:#22d3ee,color:#04060c;
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef rose fill:#fb7185,color:#04060c;
```

### Later — *grow the swarm*

- [ ] A2A agent-to-agent handoffs → planner agents delegate to AuroraLens specialists
- [ ] Community alert webhooks → Discord/Slack aurora pings for your latitude
- [ ] Satellite-drag + GPS-impact estimators → serve the space-ops niche that pays attention

```mermaid
flowchart LR
    A2A["A2A handoffs<br/>agent swarm"]:::emerald
    HOOKS["Alert webhooks<br/>Discord · Slack"]:::cyan
    DRAG["Sat-drag estimator<br/>space-ops niche"]:::violet
    SWARM["Aurora swarm<br/>everywhere"]:::amber
    A2A --> SWARM
    HOOKS --> SWARM
    DRAG --> SWARM
    classDef cyan fill:#22d3ee,color:#04060c;
    classDef violet fill:#a78bfa,color:#04060c;
    classDef emerald fill:#34d399,color:#04060c;
    classDef amber fill:#fbbf24,color:#04060c;
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). One rule to remember: **one function, three
consumers** — scoring logic lives in `src/lib/engine.ts` so UI, REST and MCP never drift.

## 📜 License

MIT — see [LICENSE](./LICENSE). Feed data courtesy of **NOAA SWPC** and the **USGS
Earthquake Hazards Program**; this project is not affiliated with either.
