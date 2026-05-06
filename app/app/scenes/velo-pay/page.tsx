"use client";

import { SceneShell } from "@/components/scene-shell";
import { AttestationGate } from "@/components/attestation-gate";
import { DEMO_AGENT, DIM_PAYMENT } from "@/lib/cypher-config";

export default function VeloPayPage() {
  const accent = "#059669";

  return (
    <SceneShell
      theme={{
        brandName: "Velo Pay",
        tagline: "Private MPP merchant checkout",
        bg: "bg-emerald-50/40",
        surface: "bg-white",
        ink: "text-emerald-950",
        muted: "text-emerald-900/60",
        border: "border-emerald-200",
        accent,
        accentSoft: "bg-emerald-100/60",
        accentText: "text-emerald-700",
      }}
    >
      <div className="mb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 mb-3">
          Order summary
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-[1.1] mb-3">
          Hardware purchase — agent fulfillment
        </h1>
        <p className="text-base text-emerald-900/60 leading-relaxed max-w-xl">
          High-value invoice, settled privately between merchant and agent. Velo
          Pay routes the payment without revealing reputation history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Invoice card */}
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-emerald-100 bg-emerald-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Invoice #VLP-4821
                </span>
                <span className="text-xs font-mono text-emerald-900/60">
                  Apr 30 2026
                </span>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Row label="Subtotal" value="$12,400.00" />
              <Row label="Shipping (2-day)" value="$0.00" />
              <Row label="Sales tax" value="$1,054.00" />
              <div className="border-t border-emerald-100 pt-4">
                <Row label="Total due" value="$13,454.00" big />
              </div>
            </div>
            <div className="px-6 py-4 bg-emerald-50/40 border-t border-emerald-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-900/60">Counterparty agent</span>
                <span className="font-mono text-emerald-900/80">
                  {DEMO_AGENT.toBase58().slice(0, 8)}…
                  {DEMO_AGENT.toBase58().slice(-6)}
                </span>
              </div>
            </div>
          </div>

          {/* Policy callout */}
          <div className="bg-white rounded-xl border border-emerald-200 p-5">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"
                aria-hidden
              >
                <span className="text-emerald-700 text-sm font-bold">VP</span>
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">
                  Velo Pay merchant policy
                </div>
                <p className="text-sm text-emerald-900/70 leading-relaxed">
                  Agent counterparties must demonstrate{" "}
                  <span className="font-mono font-semibold">
                    payment reliability ≥ 7
                  </span>{" "}
                  to settle high-value invoices. Cypher attests without
                  revealing the underlying score.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 lg:pt-2">
          <AttestationGate
            agent={DEMO_AGENT}
            dimension={DIM_PAYMENT}
            threshold={7}
            brand={{
              name: "Velo Pay",
              accent,
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

function Row({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span
        className={
          big ? "text-base font-medium" : "text-sm text-emerald-900/70"
        }
      >
        {label}
      </span>
      <span className={big ? "text-3xl font-bold tracking-tight" : "text-sm font-medium"}>
        {value}
      </span>
    </div>
  );
}