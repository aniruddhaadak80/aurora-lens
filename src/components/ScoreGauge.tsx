"use client";

import { motion } from "framer-motion";
import type { StormFactor, StormLevel } from "@/lib/types";

const LEVEL_COLOR: Record<StormLevel, string> = {
  Quiet: "#34d399",
  Unsettled: "#22d3ee",
  Active: "#fbbf24",
  Storm: "#fb923c",
  Severe: "#fb7185",
};

export default function ScoreGauge({
  score,
  level,
  factors,
}: {
  score: number;
  level: StormLevel;
  factors: StormFactor[];
}) {
  const color = LEVEL_COLOR[level];
  const R = 84;
  const C = 2 * Math.PI * R;
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-col items-center gap-6 md:flex-row">
        <div className="relative h-56 w-56 shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="14" />
            <motion.circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              whileInView={{ strokeDashoffset: C - (C * score) / 100 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 12px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex rotate-0 flex-col items-center justify-center">
            <span className="font-display text-6xl font-700 font-bold" style={{ color }}>
              {score}
            </span>
            <span className="mt-1 text-xs tracking-[0.3em] text-slate-400 uppercase">{level}</span>
          </div>
        </div>
        <div className="w-full space-y-3">
          {factors.map((f, i) => (
            <div key={f.name}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-slate-200">{f.name}</span>
                <span className="shrink-0 text-slate-400">
                  {f.display} · {f.points} × {f.weight}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-400/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}, #a78bfa)` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${f.points}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.08 }}
                />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{f.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
