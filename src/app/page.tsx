import Link from "next/link";import {
  Activity,
  Atom,
  Radio,
  Satellite,
  ShieldCheck,
  Star,
  Terminal,
  Waves,
  Zap,
} from "lucide-react";
import { assessStorm, sealAssessment } from "@/lib/engine";
import { getQuakes, getSpaceWeather } from "@/lib/live";
import GlobeSection from "@/components/GlobeSection";
import McpConsole from "@/components/McpConsole";
import ScoreGauge from "@/components/ScoreGauge";
import Ticker from "@/components/Ticker";

export const revalidate = 300;

function SectionHead({ n, title, blurb }: { n: string; title: string; blurb: string }) {
  return (
    <div className="mb-8">
      <p className="font-display text-sm font-semibold tracking-[0.35em] text-cyan-300 uppercase">
        {n}
      </p>
      <h2 className="font-display mt-2 text-3xl font-bold text-white md:text-4xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-slate-400">{blurb}</p>
    </div>
  );
}

export default async function Home() {
  const [space, quakes] = await Promise.all([getSpaceWeather(), getQuakes()]);
  const fl = space.flares[0];
  const assessment = assessStorm({
    kp: space.kp.kp,
    solarWindSpeed: space.wind.speed,
    bz: space.wind.bz,
    maxFlare: fl ? `${fl.classType}${fl.magnitude}` : null,
    alertCount: space.alerts.length,
    maxQuake: quakes.maxMag,
    source: space.source === "live" && quakes.source === "live" ? "live" : "fallback",
  });
  const sealed = await sealAssessment(assessment);

  const tickerItems = [
    ...(space.kp.kp != null ? [`Kp ${space.kp.kp.toFixed(2)} planetary index`] : []),
    ...(space.wind.speed != null ? [`Solar wind ${Math.round(space.wind.speed)} km/s`] : []),
    ...(space.wind.bz != null ? [`IMF Bz ${space.wind.bz.toFixed(1)} nT`] : []),
    ...space.flares.slice(0, 3).map((f) => `Flare ${f.classType}${f.magnitude}`),
    ...space.alerts.slice(0, 3).map((a) => a.kind),
    ...(quakes.quakes[0] ? [`M${quakes.quakes[0].mag.toFixed(1)} — ${quakes.quakes[0].place}`] : []),
    `Storm score ${sealed.score} (${sealed.level})`,
  ];

  const stats = [
    { icon: Activity, label: "Planetary Kp", value: space.kp.kp != null ? space.kp.kp.toFixed(2) : "—", tint: "#22d3ee" },
    { icon: Zap, label: "Solar wind", value: space.wind.speed != null ? `${Math.round(space.wind.speed)} km/s` : "—", tint: "#a78bfa" },
    { icon: Radio, label: "IMF Bz", value: space.wind.bz != null ? `${space.wind.bz.toFixed(1)} nT` : "—", tint: "#fbbf24" },
    { icon: Waves, label: "M4.5+ quakes / 24h", value: String(quakes.count), tint: "#fb7185" },
    { icon: ShieldCheck, label: "Storm score", value: `${sealed.score} · ${sealed.level}`, tint: "#34d399" },
  ];

  return (
    <main className="relative">
      <div className="grid-texture pointer-events-none absolute inset-x-0 top-0 h-[720px]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 animate-aurora rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.22),rgba(167,139,250,0.12),transparent)] blur-2xl" />

      {/* HERO */}
      <header className="relative mx-auto max-w-6xl px-5 pt-16 pb-10 text-center md:pt-24">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-medium tracking-widest text-emerald-300 uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live · NOAA SWPC + USGS · {space.source === "live" ? "streaming" : "offline fallback sealed"}
        </div>
        <h1 className="font-display text-5xl leading-[1.02] font-bold text-white md:text-7xl">
          The Sun is shouting.
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent text-glow-cyan">
            AuroraLens listens.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
          Real-time solar-storm + seismic operations on a living 3D planet — deterministic risk
          scores, hash-chained audit seals, and an MCP tool interface coding agents can call.
          Zero API keys.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#planet"
            className="rounded-full bg-cyan-400 px-7 py-3 text-sm font-semibold text-[#04060c] transition hover:brightness-110"
          >
            See the live planet
          </Link>
          <Link
            href="#agents"
            className="rounded-full border border-slate-400/25 px-7 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-400/60 hover:text-violet-300"
          >
            Use it as an agent tool
          </Link>
          <Link
            href="https://github.com/aniruddhaadak80/aurora-lens"
            className="inline-flex items-center gap-2 rounded-full border border-slate-400/25 px-7 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/60 hover:text-amber-300"
          >
            <Star className="h-4 w-4" /> Star on GitHub
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-left">
              <s.icon className="mb-2 h-5 w-5" style={{ color: s.tint }} />
              <p className="font-display text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs tracking-wider text-slate-500 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      <Ticker items={tickerItems} />

      {/* 01 LIVE */}
      <section id="live" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead
          n="01 — Live"
          title="Two planetary feeds, one normalized stream"
          blurb="NOAA's Space Weather Prediction Center and the USGS earthquake feed, polled through cached API routes with sealed offline fallbacks — the demo never goes dark."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass rounded-3xl p-6">
            <div className="mb-3 flex items-center gap-2 text-cyan-300">
              <Satellite className="h-5 w-5" />
              <h3 className="font-display font-semibold">Solar wind · L1 point</h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Speed</dt><dd className="text-white">{space.wind.speed != null ? `${Math.round(space.wind.speed)} km/s` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Density</dt><dd className="text-white">{space.wind.density != null ? `${space.wind.density.toFixed(1)} p/cm³` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Bz / Bt</dt><dd className="text-white">{space.wind.bz != null ? `${space.wind.bz.toFixed(1)} / ${space.wind.bt?.toFixed(1) ?? "—"} nT` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Source</dt><dd className={space.source === "live" ? "text-emerald-300" : "text-amber-300"}>{space.source}</dd></div>
            </dl>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="mb-3 flex items-center gap-2 text-violet-300">
              <Zap className="h-5 w-5" />
              <h3 className="font-display font-semibold">Flares + alerts</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {space.flares.slice(0, 3).map((f, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-white">{f.classType}{f.magnitude}{f.region ? ` · ${f.region}` : ""}</span>
                  <span className="shrink-0 text-slate-500">{f.time.slice(5, 16).replace("T", " ")}</span>
                </li>
              ))}
              {space.alerts.slice(0, 2).map((a, i) => (
                <li key={`a${i}`} className="truncate text-amber-300/90">⚠ {a.kind}</li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="mb-3 flex items-center gap-2 text-rose-300">
              <Waves className="h-5 w-5" />
              <h3 className="font-display font-semibold">Strongest quakes · 24h</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {quakes.quakes.slice(0, 4).map((q) => (
                <li key={q.id} className="flex justify-between gap-2">
                  <span className="truncate text-white">M{q.mag.toFixed(1)} · {q.place}</span>
                  <span className="shrink-0 text-slate-500">{q.time.slice(5, 10)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 02 ENGINE */}
      <section id="engine" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead
          n="02 — Engine"
          title="One deterministic score, fully itemized"
          blurb="No black boxes: six weighted factors turn Kp, solar wind, Bz, flares, alerts and seismic context into a 0–100 score. The same function powers this page, the REST API and every MCP tool."
        />
        <ScoreGauge score={sealed.score} level={sealed.level} factors={sealed.factors} />
      </section>

      {/* 03 PLANET */}
      <section id="planet" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead
          n="03 — Planet"
          title="The whole storm, on one globe"
          blurb="USGS quakes as glowing points, storm-impact arcs and pulsing auroral-oval rings on a night-earth globe. Drag to take over — it resumes its watch when you let go."
        />
        <GlobeSection quakes={quakes.quakes} />
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Atom className="h-3.5 w-3.5" /> 3D by react-globe.gl · {quakes.count} quakes plotted ·{" "}
          {quakes.source} feed
        </p>
      </section>

      {/* 04 AGENTS */}
      <section id="agents" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead
          n="04 — Agents"
          title="Your coding agent can fly this"
          blurb="A JSON-RPC MCP interface over the exact same data and engine. Prove it to yourself — the console below is live."
        />
        <McpConsole />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="glass rounded-3xl p-6">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Terminal className="h-4 w-4 text-emerald-300" /> curl it
            </p>
            <pre className="overflow-auto font-mono text-xs leading-relaxed text-slate-300">
{`curl -s https://aurora-lens.vercel.app/api/mcp \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"assess_storm","arguments":{}}}'`}
            </pre>
          </div>
          <div className="glass rounded-3xl p-6">
            <p className="mb-2 text-sm font-semibold text-slate-200">mcp.json — add to your agent</p>
            <pre className="overflow-auto font-mono text-xs leading-relaxed text-slate-300">
{`{
  "mcpServers": {
    "aurora-lens": {
      "url": "https://aurora-lens.vercel.app/api/mcp",
      "transport": "streamable-http"
    }
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* 05 INTEGRITY */}
      <section id="integrity" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead
          n="05 — Integrity"
          title="Every score is sealed, every seal replays"
          blurb="Each assessment carries SHA-384(prevSeal ‖ canonicalJson) — a hash chain anchored to a daily genesis. Replay any record through /api/verify."
        />
        <div className="glass rounded-3xl p-6 font-mono text-xs break-all">
          <p><span className="text-slate-500">prevSeal</span> <span className="text-amber-300">{sealed.prevSeal.slice(0, 64)}…</span></p>
          <p className="mt-2"><span className="text-slate-500">seal&nbsp;&nbsp;&nbsp;&nbsp;</span> <span className="text-emerald-300">{sealed.seal.slice(0, 64)}…</span></p>
          <p className="mt-2 text-slate-500">verify → POST /api/verify {"{ records: [...] }"} → {"{ ok: true, checked: n }"}</p>
        </div>
        <p className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200/80">
          Safety note: AuroraLens is an educational space-weather dashboard, not an operational
          warning system. For grid, aviation or satellite decisions always consult official NOAA
          SWPC alerts directly.
        </p>
      </section>

      <footer className="border-t border-slate-400/10 py-10 text-center text-sm text-slate-500">
        <p className="font-display font-semibold text-slate-300">AuroraLens</p>
        <p className="mt-1">
          Feeds: NOAA SWPC · USGS · Built with Next.js + react-globe.gl · MIT ·{" "}
          <Link href="https://github.com/aniruddhaadak80/aurora-lens" className="text-cyan-300 hover:underline">
            GitHub
          </Link>
        </p>
      </footer>
    </main>
  );
}
