"use client";

import dynamic from "next/dynamic";
import type { Quake } from "@/lib/types";

const StormGlobe = dynamic(() => import("@/components/StormGlobe"), {
  ssr: false,
  loading: () => (
    <div className="glass flex h-[560px] w-full animate-pulse flex-col items-center justify-center gap-3 rounded-3xl">
      <div className="h-40 w-40 rounded-full bg-gradient-to-br from-cyan-500/30 via-violet-500/20 to-emerald-500/20" />
      <p className="text-sm tracking-widest text-slate-400 uppercase">Igniting 3D planet…</p>
    </div>
  ),
});

export default function GlobeSection({ quakes }: { quakes: Quake[] }) {
  return <StormGlobe quakes={quakes} />;
}
