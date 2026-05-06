"use client";

import { AttestationGate } from "@/components/attestation-gate";
import { DEMO_AGENT, DIM_PAYMENT, DIM_CREDIT, DIM_VOLUME } from "@/lib/cypher-config";

export default function TestPage() {
  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">AttestationGate test</h1>
      <p className="text-sm text-muted-foreground">
        Click each gate to test the full verification flow. Same agent, three different gates.
      </p>

      <AttestationGate
        agent={DEMO_AGENT}
        dimension={DIM_PAYMENT}
        threshold={7}
        brand={{
          name: "Test Merchant",
          accent: "#10b981",
          approveCta: "Verify payment reliability",
          approvedLabel: "Payment standing verified",
        }}
        thresholdLabel="Minimum payment reliability ≥ 7"
      />

      <AttestationGate
        agent={DEMO_AGENT}
        dimension={DIM_CREDIT}
        threshold={6}
        brand={{
          name: "Test Lender",
          accent: "#3b82f6",
          approveCta: "Verify credit worthiness",
          approvedLabel: "Credit standing verified",
        }}
        thresholdLabel="Minimum credit worthiness ≥ 6"
      />

      <AttestationGate
        agent={DEMO_AGENT}
        dimension={DIM_VOLUME}
        threshold={3}
        brand={{
          name: "Test Auction",
          accent: "#8b5cf6",
          approveCta: "Verify volume tier",
          approvedLabel: "Tier 3+ verified",
        }}
        thresholdLabel="Minimum volume tier ≥ T3"
      />

      <AttestationGate
        agent={DEMO_AGENT}
        dimension={DIM_VOLUME}
        threshold={4}
        brand={{
          name: "T4-only Auction",
          accent: "#ef4444",
          approveCta: "Verify Tier 4",
          approvedLabel: "Tier 4 elite verified",
        }}
        thresholdLabel="Minimum volume tier ≥ T4 (this should FAIL)"
      />
    </div>
  );
}
