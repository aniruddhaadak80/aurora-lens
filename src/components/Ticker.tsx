"use client";

export default function Ticker({ items }: { items: string[] }) {
  const line = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-slate-400/10 bg-black/40 py-2.5">
      <div className="marquee-track flex w-max items-center gap-10 pr-10">
        {line.map((t, i) => (
          <span key={i} className="flex items-center gap-3 text-sm whitespace-nowrap text-slate-300">
            <span className="inline-block h-1.5 w-1.5 animate-twinkle rounded-full bg-cyan-400" />
            {t}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#04060c] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#04060c] to-transparent" />
    </div>
  );
}
