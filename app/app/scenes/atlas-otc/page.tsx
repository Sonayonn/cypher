"use client";

import { SceneShell } from "@/components/scene-shell";
import { AttestationGate } from "@/components/attestation-gate";
import { DEMO_AGENT, DIM_VOLUME } from "@/lib/cypher-config";

export default function AtlasOtcPage() {
  return (
    <SceneShell
      theme={{
        brandName: "Atlas OTC",
        tagline: "Sealed-bid private auctions",
        bg: "bg-zinc-950",
        surface: "bg-zinc-900",
        ink: "text-zinc-50",
        muted: "text-zinc-400",
        accent: "#a855f7",
      }}
    >
      <div className="mt-8">
        <div className="text-xs uppercase tracking-widest text-zinc-400 mb-2">
          Live auction · closes in 14:32:09
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">
          Lot #4119 · 2.4M $ORCA · sealed bid
        </h1>
        <p className="text-zinc-400 mb-8">
          Floor: $1.84/token · Reserve: undisclosed · Restricted to T3+ agents
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-5">
            <Stat label="Active bidders" value="6" />
            <Stat label="Last clearing price" value="$1.91" />
            <Stat label="24h volume cleared" value="$4.2M" />
            <Stat
              label="Your wallet"
              value={`${DEMO_AGENT.toBase58().slice(0, 6)}…${DEMO_AGENT.toBase58().slice(-4)}`}
              mono
            />
            <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-500">
              Atlas restricts auction access to bidders demonstrating tier 3+
              transaction volume in the last 30 days. Cypher provides the
              attestation without revealing exact figures.
            </div>
          </div>

          <div className="md:pt-8">
            <AttestationGate
              agent={DEMO_AGENT}
              dimension={DIM_VOLUME}
              threshold={3}
              brand={{
                name: "Atlas OTC",
                accent: "#a855f7",
                approveCta: "Enter sealed-bid auction",
                approvedLabel: "T3+ access granted",
              }}
              thresholdLabel="Minimum volume tier ≥ T3"
            />
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
