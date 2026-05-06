"use client";

import { SceneShell } from "@/components/scene-shell";
import { AttestationGate } from "@/components/attestation-gate";
import { DEMO_AGENT, DIM_VOLUME } from "@/lib/cypher-config";

export default function AtlasOtcPage() {
  const accent = "#a855f7";

  return (
    <SceneShell
      theme={{
        brandName: "Atlas OTC",
        tagline: "Sealed-bid private auctions",
        bg: "bg-zinc-950",
        surface: "bg-zinc-900",
        ink: "text-zinc-50",
        muted: "text-zinc-400",
        border: "border-zinc-800",
        accent,
        accentSoft: "bg-violet-500/10",
        accentText: "text-violet-400",
      }}
    >
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-400 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Live auction · closes in 14:32:09
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-[1.1] mb-3">
          Lot #4119 · 2.4M $ORCA · sealed bid
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          <span>
            Floor: <span className="text-zinc-100 font-medium">$1.84/token</span>
          </span>
          <span className="text-zinc-700">·</span>
          <span>Reserve: undisclosed</span>
          <span className="text-zinc-700">·</span>
          <span className="text-violet-400">Restricted to T3+ agents</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Live auction state
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Block 312,948,201
              </span>
            </div>
            <div className="px-6 py-6 grid grid-cols-2 gap-x-6 gap-y-5">
              <Stat label="Active bidders" value="6" />
              <Stat label="Last clearing price" value="$1.91" />
              <Stat label="24h volume cleared" value="$4.2M" />
              <Stat label="Settlement venue" value="Atlas-OTC-3" mono />
            </div>
            <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Your wallet</span>
                <span className="font-mono text-zinc-300">
                  {DEMO_AGENT.toBase58().slice(0, 8)}…
                  {DEMO_AGENT.toBase58().slice(-6)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0"
                aria-hidden
              >
                <span className="text-violet-400 text-sm font-bold">A</span>
              </div>
              <div>
                <div className="text-sm font-semibold mb-1 text-zinc-100">
                  Atlas tier policy
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Auction access restricted to bidders demonstrating{" "}
                  <span className="font-mono font-semibold text-zinc-200">
                    volume tier ≥ T3
                  </span>{" "}
                  in the last 30 days. Cypher attests without revealing exact
                  figures, preserving bidder anonymity.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 lg:pt-2">
          <AttestationGate
            agent={DEMO_AGENT}
            dimension={DIM_VOLUME}
            threshold={3}
            brand={{
              name: "Atlas OTC",
              accent,
              approveCta: "Enter sealed-bid auction",
              approvedLabel: "T3+ access granted",
            }}
            thresholdLabel="Minimum volume tier ≥ T3"
          />
        </div>
      </div>
    </SceneShell>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className={`text-base font-semibold text-zinc-100 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}