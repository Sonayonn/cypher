"use client";

import { SceneShell } from "@/components/scene-shell";
import { AttestationGate } from "@/components/attestation-gate";
import { DEMO_AGENT, DIM_PAYMENT } from "@/lib/cypher-config";

export default function VeloPayPage() {
  return (
    <SceneShell
      theme={{
        brandName: "Velo Pay",
        tagline: "Private MPP merchant checkout",
        bg: "bg-emerald-50",
        surface: "bg-white",
        ink: "text-emerald-950",
        muted: "text-emerald-700/70",
        accent: "#059669",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-emerald-700/70 mb-2">
            Order summary
          </div>
          <h1 className="text-3xl font-bold mb-6 tracking-tight">
            Hardware purchase — agent fulfillment
          </h1>

          <div className="bg-white rounded-lg p-6 space-y-4 border border-emerald-100">
            <Row label="Subtotal" value="$12,400.00" />
            <Row label="Shipping" value="$0.00" />
            <Row label="Tax" value="$1,054.00" />
            <div className="border-t border-emerald-100 pt-4">
              <Row label="Total due" value="$13,454.00" big />
            </div>
            <div className="text-xs text-emerald-700/70 pt-2">
              Counterparty:{" "}
              <span className="font-mono">
                {DEMO_AGENT.toBase58().slice(0, 6)}…{DEMO_AGENT.toBase58().slice(-4)}
              </span>
            </div>
          </div>

          <div className="mt-6 text-sm text-emerald-700/80">
            <span className="font-semibold">Velo Pay's policy:</span> agent
            counterparties must demonstrate Payment Reliability ≥ 7 to settle
            high-value invoices privately.
          </div>
        </div>

        <div className="md:pt-12">
          <AttestationGate
            agent={DEMO_AGENT}
            dimension={DIM_PAYMENT}
            threshold={7}
            brand={{
              name: "Velo Pay",
              accent: "#059669",
              approveCta: "Approve & settle",
              approvedLabel: "Verified merchant standing",
            }}
            thresholdLabel="Minimum payment reliability ≥ 7"
          />
        </div>
      </div>
    </SceneShell>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={big ? "text-base font-medium" : "text-sm text-emerald-700/80"}>
        {label}
      </span>
      <span className={big ? "text-2xl font-bold" : "text-sm"}>
        {value}
      </span>
    </div>
  );
}
