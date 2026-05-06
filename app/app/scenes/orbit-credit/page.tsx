"use client";

import { SceneShell } from "@/components/scene-shell";
import { AttestationGate } from "@/components/attestation-gate";
import { DEMO_AGENT, DIM_CREDIT } from "@/lib/cypher-config";

export default function OrbitCreditPage() {
  const accent = "#2563eb";

  return (
    <SceneShell
      theme={{
        brandName: "Orbit Credit",
        tagline: "Undercollateralized lending for autonomous agents",
        bg: "bg-blue-50/40",
        surface: "bg-white",
        ink: "text-blue-950",
        muted: "text-blue-900/60",
        border: "border-blue-200",
        accent,
        accentSoft: "bg-blue-100/60",
        accentText: "text-blue-700",
      }}
    >
      <div className="mb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 mb-3">
          Loan application · L-9024
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-[1.1] mb-3">
          $80,000 working capital line
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-blue-900/70">
          <span>7-day revolving credit</span>
          <span className="text-blue-300">·</span>
          <span>4.2% APR</span>
          <span className="text-blue-300">·</span>
          <span>Unsecured</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-blue-100 bg-blue-50/40">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Loan terms
              </span>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Field label="Requested principal" value="$80,000" />
              <Field label="Term" value="7 days" />
              <Field label="Effective APR" value="4.2%" />
              <Field label="Estimated interest" value="$64.55" />
              <Field label="Collateral" value="None (unsecured)" highlight />
            </div>
            <div className="px-6 py-4 bg-blue-50/40 border-t border-blue-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-900/60">Borrower</span>
                <span className="font-mono text-blue-900/80">
                  {DEMO_AGENT.toBase58().slice(0, 8)}…
                  {DEMO_AGENT.toBase58().slice(-6)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-blue-200 p-5">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"
                aria-hidden
              >
                <span className="text-blue-700 text-sm font-bold">OC</span>
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">
                  Orbit Credit underwriting policy
                </div>
                <p className="text-sm text-blue-900/70 leading-relaxed">
                  Unsecured agent debt requires{" "}
                  <span className="font-mono font-semibold">
                    credit worthiness ≥ 6
                  </span>{" "}
                  for lines above $50,000. Cypher provides the attestation in
                  one call — no underwriting interviews, no document review.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 lg:pt-2">
          <AttestationGate
            agent={DEMO_AGENT}
            dimension={DIM_CREDIT}
            threshold={6}
            brand={{
              name: "Orbit Credit",
              accent,
              approveCta: "Verify & disburse",
              approvedLabel: "Loan tier unlocked",
            }}
            thresholdLabel="Minimum credit worthiness ≥ 6"
          />
        </div>
      </div>
    </SceneShell>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-blue-900/70">{label}</span>
      <span
        className={`text-sm ${
          highlight
            ? "font-bold text-blue-900"
            : "font-medium text-blue-950"
        }`}
      >
        {value}
      </span>
    </div>
  );
}