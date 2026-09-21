"use client";

import { useState } from "react";
import { Bot, Loader2, Play, Terminal } from "lucide-react";

async function rpc(method: string, params?: Record<string, unknown>) {
  const res = await fetch("/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params: params ?? {} }),
  });
  return res.json();
}

const PRESETS: Array<{ label: string; method: string; params?: Record<string, unknown> }> = [
  { label: "initialize", method: "initialize" },
  { label: "tools/list", method: "tools/list" },
  { label: "get_space_weather", method: "tools/call", params: { name: "get_space_weather", arguments: {} } },
  { label: "get_quakes", method: "tools/call", params: { name: "get_quakes", arguments: {} } },
  { label: "assess_storm (live)", method: "tools/call", params: { name: "assess_storm", arguments: {} } },
  {
    label: "assess_storm (X-flare drill)",
    method: "tools/call",
    params: {
      name: "assess_storm",
      arguments: { kp: 8, solarWindSpeed: 780, bz: -18, maxFlare: "X2.1", alertCount: 6, maxQuake: 6.4 },
    },
  },
];

export default function McpConsole() {
  const [output, setOutput] = useState<string>('Click "Run full demo" — tools/list → assess_storm, live in this page.');
  const [busy, setBusy] = useState(false);

  const run = async (method: string, params?: Record<string, unknown>) => {
    setBusy(true);
    try {
      const data = await rpc(method, params);
      setOutput(JSON.stringify(data, null, 2).slice(0, 6000));
    } catch (e) {
      setOutput(`request failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const demo = async () => {
    setBusy(true);
    try {
      const list = await rpc("tools/list");
      const score = await rpc("tools/call", { name: "assess_storm", arguments: {} });
      const tools = (list.result?.tools ?? []).map((t: { name: string }) => t.name).join(", ");
      setOutput(
        `TOOLS → ${tools}\n\nSCORE → ${score.result?.content?.[0]?.score} (${score.result?.content?.[0]?.level})\nSEAL → ${String(score.result?.content?.[0]?.seal ?? "").slice(0, 48)}…\n\n${JSON.stringify(score, null, 2).slice(0, 4500)}`
      );
    } catch (e) {
      setOutput(`demo failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={demo}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-[#04060c] transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run full demo
        </button>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => void run(p.method, p.params)}
            disabled={busy}
            className="rounded-full border border-slate-400/20 px-4 py-2 text-xs text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-400/10 bg-black/60 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs tracking-widest text-slate-500 uppercase">
          <Terminal className="h-3.5 w-3.5" />
          <Bot className="h-3.5 w-3.5" />
          MCP JSON-RPC · POST /api/mcp
        </div>
        <pre className="max-h-96 overflow-auto font-mono text-xs leading-relaxed text-emerald-300">{output}</pre>
      </div>
    </div>
  );
}
