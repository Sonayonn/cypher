"use client";

import { SceneShell } from "@/components/scene-shell";
import { AttestationGate } from "@/components/attestation-gate";
import { DEMO_AGENT, DIM_CREDIT } from "@/lib/cypher-config";

export default function OrbitCreditPage() {
  return (
    <SceneShell
      theme={{
        brandName: "Orbit Credit",
        tagline: "Undercollateralized lending for autonomous agents",
        bg: "bg-blue-50",
        surface: "bg-white",
        ink: "text-blue-950",
        muted: "text-blue-700/70",
        accent: "#2563eb",
      }}
    >
      <div className="mt-8">
        <div className="text-xs uppercase tracking-widest text-blue-700/70 mb-2">
          Loan application
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">
          $80,000 working capital line
        </h1>
        <p className="text-blue-700/80 mb-8">
          7-day revolving credit · 4.2% APR · Unsecured
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-6 border border-blue-100 space-y-5">
            <Field label="Requested principal" value="$80,000" />
            <Field label="Term" value="7 days" />
            <Field label="Effective APR" value="4.2%" />
            <Field label="Estimated interest" value="$64.55" />
            <Field
              label="Borrower"
              value={`${DEMO_AGENT.toBase58().slice(0, 6)}…${DEMO_AGENT.toBase58().slice(-4)}`}
              mono
            />
            <div className="pt-3 border-t border-blue-100 text-xs text-blue-700/70">
              Orbit Credit underwrites unsecured agent debt. Credit Worthiness ≥ 6
              required to access lines above $50,000.
            </div>
          </div>

          <div className="md:pt-8">
            <AttestationGate
              agent={DEMO_AGENT}
              dimension={DIM_CREDIT}
              threshold={6}
              brand={{
                name: "Orbit Credit",
                accent: "#2563eb",
                approveCta: "Verify & disburse",
                approvedLabel: "Loan tier unlocked",
              }}
              thresholdLabel="Minimum credit worthiness ≥ 6"
            />
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-blue-700/70">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
