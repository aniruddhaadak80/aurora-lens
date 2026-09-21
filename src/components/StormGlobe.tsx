"use client";

// AuroraLens planet — library-grade 3D via react-globe.gl (lazy, client-only).
// Pick: react-globe.gl — data-on-a-planet needs points + arcs + rings + atmosphere + auto-rotate, fastest path to beautiful.
// A tiny 2D canvas renders ONLY if the library import fails, never as the primary visual.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Quake } from "@/lib/types";

type GlobeComponent = React.ComponentType<Record<string, unknown>>;

const quakeColor = (m: number) => (m >= 6 ? "#fb7185" : m >= 5 ? "#fbbf24" : "#22d3ee");

function FallbackCanvas({ quakes }: { quakes: Quake[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      const w = (canvas.width = canvas.clientWidth * 2);
      const h = (canvas.height = 560 * 2);
      ctx.fillStyle = "#04060c";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle = `rgba(148,163,184,${0.15 + Math.random() * 0.5})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      for (const q of quakes) {
        const x = ((q.lon + 180) / 360) * w;
        const y = ((90 - q.lat) / 180) * h;
        ctx.beginPath();
        ctx.arc(x, y, 4 + q.mag * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = quakeColor(q.mag);
        ctx.shadowColor = quakeColor(q.mag);
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };
    draw();
  }, [quakes]);
  return (
    <div className="glass rounded-3xl p-4">
      <p className="mb-2 text-xs tracking-widest text-slate-400 uppercase">
        3D library unavailable — 2D fallback map
      </p>
      <canvas ref={ref} className="h-[560px] w-full rounded-2xl" />
    </div>
  );
}

export default function StormGlobe({ quakes }: { quakes: Quake[] }) {
  const [GlobeComp, setGlobeComp] = useState<GlobeComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const globeRef = useRef<{ controls: () => { autoRotate: boolean; addEventListener: (e: string, f: () => void) => void } } | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 560 });

  useEffect(() => {
    let alive = true;
    import("react-globe.gl")
      .then((m) => {
        if (alive) setGlobeComp(() => (m.default as GlobeComponent));
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: 560 });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-rotate that pauses while the user drags, resumes after 8 s idle.
  useEffect(() => {
    if (!GlobeComp || !globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    const pause = () => {
      controls.autoRotate = false;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
    const resumeSoon = () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => {
        controls.autoRotate = true;
      }, 8000);
    };
    controls.addEventListener("start", pause);
    controls.addEventListener("end", resumeSoon);
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [GlobeComp]);

  const points = useMemo(
    () =>
      quakes.map((q) => ({
        lat: q.lat,
        lng: q.lon,
        size: 0.25 + q.mag * 0.14,
        color: quakeColor(q.mag),
        label: `M${q.mag.toFixed(1)} — ${q.place}`,
      })),
    [quakes]
  );

  const arcs = useMemo(() => {
    const top = [...quakes].sort((a, b) => b.mag - a.mag).slice(0, 8);
    return top.map((q, i) => ({
      startLat: q.lat,
      startLng: q.lon,
      endLat: q.lat >= 0 ? 67 : -67,
      endLng: -100 + i * 28,
      color: ["rgba(251,113,133,0.85)", "rgba(167,139,250,0.85)"],
    }));
  }, [quakes]);

  const rings = useMemo(
    () => [
      { lat: 67, lng: -100, maxR: 9, propagationSpeed: 1.6, repeatPeriod: 2400 },
      { lat: 67, lng: 20, maxR: 7, propagationSpeed: 1.2, repeatPeriod: 3000 },
      { lat: -67, lng: 140, maxR: 7, propagationSpeed: 1.2, repeatPeriod: 3200 },
    ],
    []
  );

  if (failed) return <FallbackCanvas quakes={quakes} />;

  if (!GlobeComp) {
    return (
      <div className="glass flex h-[560px] w-full animate-pulse flex-col items-center justify-center gap-3 rounded-3xl">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-cyan-500/30 via-violet-500/20 to-emerald-500/20 blur-[1px]" />
        <p className="text-sm tracking-widest text-slate-400 uppercase">Igniting 3D planet…</p>
      </div>
    );
  }

  const G = GlobeComp;
  return (
    <div ref={wrapRef} className="glass overflow-hidden rounded-3xl">
      <G
        ref={globeRef}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.22}
        pointsData={points}
        pointAltitude={0.02}
        pointRadius="size"
        pointColor="color"
        pointLabel="label"
        arcsData={arcs}
        arcColor="color"
        arcDashLength={0.5}
        arcDashGap={0.15}
        arcDashAnimateTime={2200}
        ringsData={rings}
        ringColor={() => "rgba(52,211,153,0.7)"}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />
    </div>
  );
}
