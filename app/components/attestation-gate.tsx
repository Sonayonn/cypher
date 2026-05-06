"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";

import { requestAttestation, AttestationResult } from "@/lib/cypher-client";
import { DIMENSION_LABELS } from "@/lib/cypher-config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Brand = {
  name: string;             // e.g. "Velo Pay"
  accent: string;           // e.g. "#10b981" — used for the CTA + accent color
  approveCta: string;       // e.g. "Approve payment"
  approvedLabel: string;    // e.g. "Verified merchant standing"
};

export type AttestationGateProps = {
  agent: PublicKey;
  dimension: number;
  threshold: number;
  brand: Brand;
  // Optional: a label for what the threshold means (e.g. "minimum payment reliability")
  thresholdLabel?: string;
};

type Stage = "idle" | "loading" | "passed" | "failed" | "error";

export function AttestationGate({
  agent,
  dimension,
  threshold,
  brand,
  thresholdLabel,
}: AttestationGateProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<AttestationResult | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleVerify() {
    if (!wallet.connected || !wallet.publicKey) {
      setVisible(true);
      return;
    }
    setStage("loading");
    setErrorMsg(null);
    try {
      const r = await requestAttestation(
        connection,
        wallet as any, // anchor's Wallet type vs wallet-adapter's interface
        agent,
        dimension,
        threshold,
      );
      setResult(r);
      setStage(r.passes ? "passed" : "failed");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Attestation failed");
      setStage("error");
    }
  }

  return (
    <Card
      className="overflow-hidden border-2"
      style={{ borderColor: stage === "passed" ? brand.accent : undefined }}
    >
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <CardDescription>Verified by Cypher</CardDescription>
        </div>
        <CardTitle className="text-lg">
          {thresholdLabel ?? `${DIMENSION_LABELS[dimension]} ≥ ${threshold}`}
        </CardTitle>
        <CardDescription className="font-mono text-xs break-all pt-1">
          agent: {agent.toBase58().slice(0, 8)}…{agent.toBase58().slice(-6)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {stage === "idle" && (
          <Button
            onClick={handleVerify}
            className="w-full"
            style={{ backgroundColor: brand.accent, color: "white" }}
          >
            {brand.approveCta}
          </Button>
        )}

        {stage === "loading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Querying private reputation state…
            </p>
            <p className="text-xs text-muted-foreground text-center">
              The threshold check runs without exposing the underlying score.
            </p>
          </div>
        )}

        {stage === "passed" && result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-medium" style={{ color: brand.accent }}>
              <CheckCircle2 className="h-5 w-5" />
              {brand.approvedLabel}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Cypher confirms: <span className="font-mono">{DIMENSION_LABELS[result.dimension]} ≥ {result.threshold.toString()}</span>
              </div>
              <div>
                The actual value is not revealed — only that the threshold is met.
              </div>
              {txSig && (
                <a
                  href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="block underline hover:no-underline"
                >
                  View attestation on Solana Explorer →
                </a>
              )}
            </div>
          </div>
        )}

        {stage === "failed" && result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-medium text-destructive">
              <XCircle className="h-5 w-5" />
              Threshold not met
            </div>
            <div className="text-xs text-muted-foreground">
              Cypher reports this agent does not currently meet{" "}
              <span className="font-mono">{DIMENSION_LABELS[result.dimension]} ≥ {result.threshold.toString()}</span>.
              Access denied.
            </div>
            <Button variant="outline" size="sm" onClick={() => setStage("idle")}>
              Try again
            </Button>
          </div>
        )}

        {stage === "error" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-medium text-destructive">
              <XCircle className="h-5 w-5" />
              Verification failed
            </div>
            <div className="text-xs text-muted-foreground">{errorMsg}</div>
            <Button variant="outline" size="sm" onClick={() => setStage("idle")}>
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
