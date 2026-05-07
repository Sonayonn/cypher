"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CypherWalletButton } from "@/components/cypher-wallet-button";
import { PublicKey } from "@solana/web3.js";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { CypherLogo } from "@/components/cypher-logo";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  requestAttestation,
  fetchReputation,
  AttestationResult,
  AgentReputation,
  calcPaymentScore,
  calcCreditScore,
  calcVolumeTier,
  calcVolumeTotal,
} from "@/lib/cypher-client";
import {
  DEMO_AGENT,
  DIMENSION_LABELS,
  DIMENSION_DESCRIPTIONS,
  DIM_PAYMENT,
  DIM_CREDIT,
  DIM_VOLUME,
} from "@/lib/cypher-config";

type Stage = "idle" | "loading" | "result" | "error";

export default function ConsolePage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();

  const [agentInput, setAgentInput] = useState<string>(DEMO_AGENT.toBase58());
  const [dimension, setDimension] = useState<number>(DIM_PAYMENT);
  const [threshold, setThreshold] = useState<number>(7);

  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<AttestationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [previewRep, setPreviewRep] = useState<AgentReputation | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
  handleAgentChange(agentInput);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAgentChange(value: string) {
    setAgentInput(value);
    setPreviewRep(null);
    if (!value || value.length < 32) return;
    try {
      const pubkey = new PublicKey(value);
      setPreviewLoading(true);
      const rep = await fetchReputation(connection, pubkey);
      setPreviewRep(rep);
    } catch {
      setPreviewRep(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleVerify() {
    setErrorMsg(null);
    let agentPubkey: PublicKey;
    try {
      agentPubkey = new PublicKey(agentInput);
    } catch {
      setErrorMsg("Invalid agent pubkey");
      setStage("error");
      return;
    }
    if (!wallet.connected || !wallet.publicKey) {
      setVisible(true);
      return;
    }
    setStage("loading");
    try {
      const r = await requestAttestation(
        connection,
        wallet as any,
        agentPubkey,
        dimension,
        threshold,
      );
      setResult(r);
      setStage("result");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Verification failed");
      setStage("error");
    }
  }

  function reset() {
    setStage("idle");
    setResult(null);
    setErrorMsg(null);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-border sticky top-0 bg-background/80 backdrop-blur z-50">
        <div className="flex items-center gap-5">
          <CypherLogo size="md" />
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex font-medium"
          >
            Verifier console
          </Badge>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <CypherWalletButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <div className="mb-12">
          <div
            className="text-xs font-semibold uppercase tracking-[0.14em] mb-3"
            style={{ color: "var(--cypher-accent)" }}
          >
            Verifier console
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Verify any agent.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Paste any Solana pubkey, pick a dimension, set a threshold, hit
            verify. Cypher returns a yes/no without revealing the underlying
            score.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Query</CardTitle>
                <CardDescription>
                  All inputs are sent to the Cypher program on Solana devnet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Agent pubkey
                  </label>
                  <Input
                    value={agentInput}
                    onChange={(e) => handleAgentChange(e.target.value)}
                    placeholder="J15w..."
                    className="font-mono text-sm h-11"
                  />
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => handleAgentChange(DEMO_AGENT.toBase58())}
                      className="text-xs font-medium hover:underline underline-offset-4"
                      style={{ color: "var(--cypher-accent)" }}
                    >
                      Use demo agent
                    </button>
                    {wallet.publicKey && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <button
                          type="button"
                          onClick={() => handleAgentChange(wallet.publicKey!.toBase58())}
                          className="text-xs font-medium hover:underline underline-offset-4"
                          style={{ color: "var(--cypher-accent)" }}
                        >
                          Use my wallet
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Dimension
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[DIM_PAYMENT, DIM_CREDIT, DIM_VOLUME].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDimension(d);
                          if (d === DIM_VOLUME && threshold > 4) setThreshold(3);
                          else if (d !== DIM_VOLUME && threshold > 10) setThreshold(7);
                        }}
                        className={`px-3 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                          dimension === d
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground/40"
                        }`}
                      >
                        {DIMENSION_LABELS[d].split(" ")[0]}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2.5">
                    {DIMENSION_DESCRIPTIONS[dimension]}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Threshold
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      {dimension === DIM_VOLUME ? "tier 1–4" : "score 0–10"}
                    </span>
                  </label>
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value || "0", 10))}
                    min={0}
                    max={dimension === DIM_VOLUME ? 4 : 10}
                    className="w-32 h-11"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleVerify}
                    disabled={stage === "loading"}
                    className="gap-2 h-11 px-6 text-sm font-medium"
                    style={{
                      backgroundColor: "var(--cypher-accent)",
                      color: "var(--cypher-accent-fg)",
                    }}
                  >
                    {stage === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Querying Cypher…
                      </>
                    ) : (
                      <>
                        Verify <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result panel */}
            {stage === "result" && result && (
              <Card
                className="border-2"
                style={{
                  borderColor: result.passes
                    ? "var(--cypher-accent)"
                    : "rgb(244, 63, 94)",
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {result.passes ? (
                      <CheckCircle2
                        className="h-5 w-5"
                        style={{ color: "var(--cypher-accent)" }}
                      />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    )}
                    <CardTitle className="text-base font-semibold">
                      {result.passes ? "Threshold met" : "Threshold not met"}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Cypher confirms{" "}
                    <span className="font-mono">
                      {DIMENSION_LABELS[result.dimension]} ≥{" "}
                      {result.dimension === DIM_VOLUME
                        ? `T${result.threshold.toString()}`
                        : result.threshold.toString()}
                    </span>{" "}
                    is {result.passes ? "true" : "false"} for this agent.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    The threshold check executed on-chain. The privacy property:
                    your application code receives only the boolean. The underlying
                    score lives in transaction logs (publicly auditable but never
                    consumed by verifier apps).
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                    {/* What the verifier app sees */}
                    <div className="rounded-md p-3 border" style={{ borderColor: "var(--cypher-accent-border)", backgroundColor: "var(--cypher-accent-soft)" }}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--cypher-accent)" }}>
                        Your verifier app receives
                      </div>
                      <pre className="text-xs font-mono leading-relaxed">
{`{
  passes: ${result.passes},
  threshold: ${result.dimension === DIM_VOLUME ? `"T${result.threshold.toString()}"` : result.threshold.toString()},
  dimension: "${DIMENSION_LABELS[result.dimension]}"
}`}
                      </pre>
                    </div>

                    {/* What's actually on-chain */}
                    <div className="rounded-md p-3 border border-border bg-muted/40">
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                        On-chain (auditable)
                      </div>
                      <pre className="text-xs font-mono leading-relaxed text-muted-foreground">
{`{
  passes: ${result.passes},
  score: ${result.score.toString()},
  threshold: ${result.threshold.toString()},
  agent: "${result.agent.toBase58().slice(0, 8)}…",
  timestamp: ${result.timestamp.toString()}
}`}
                      </pre>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Button variant="outline" size="sm" onClick={reset}>
                      New query
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {stage === "error" && (
              <Card className="border-rose-500 border-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-rose-500" />
                    <CardTitle className="text-base font-semibold">
                      Verification error
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs font-mono">
                    {errorMsg}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" onClick={reset}>
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: live preview */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--cypher-accent)" }}
            >
              Agent preview
            </div>

            {previewLoading ? (
              <Card>
                <CardHeader>
                  <CardDescription>Looking up reputation…</CardDescription>
                </CardHeader>
              </Card>
            ) : !previewRep ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    No reputation
                  </CardTitle>
                  <CardDescription>
                    This agent has not been initialized in Cypher. Verifying
                    will return passes=false for any threshold.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs leading-relaxed">
                    Public reputation surface (the verifier still won&apos;t see
                    scores in the attestation result)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 text-sm">
                  <PreviewRow
                    label="Payment Reliability"
                    value={`${calcPaymentScore(previewRep)} / 10`}
                    detail={`${previewRep.payCompleted.toString()} / ${previewRep.payFailed.toString()} / ${previewRep.payDisputed.toString()}`}
                  />
                  <PreviewRow
                    label="Credit Worthiness"
                    value={`${calcCreditScore(previewRep)} / 10`}
                    detail={`${previewRep.creditOnTime.toString()} / ${previewRep.creditLate.toString()} / ${previewRep.creditDefaulted.toString()}`}
                  />
                  <PreviewRow
                    label="Volume Tier"
                    value={`Tier ${calcVolumeTier(previewRep)}`}
                    detail={`$${calcVolumeTotal(previewRep).toLocaleString()}`}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  Try these
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <TrySuggestion
                  desc="Demo agent passes payment ≥ 7"
                  onClick={() => {
                    handleAgentChange(DEMO_AGENT.toBase58());
                    setDimension(DIM_PAYMENT);
                    setThreshold(7);
                  }}
                />
                <TrySuggestion
                  desc="Demo agent fails payment ≥ 10"
                  onClick={() => {
                    handleAgentChange(DEMO_AGENT.toBase58());
                    setDimension(DIM_PAYMENT);
                    setThreshold(10);
                  }}
                />
                <TrySuggestion
                  desc="Demo agent passes volume tier ≥ 3"
                  onClick={() => {
                    handleAgentChange(DEMO_AGENT.toBase58());
                    setDimension(DIM_VOLUME);
                    setThreshold(3);
                  }}
                />
                <TrySuggestion
                  desc="Demo agent fails volume tier ≥ 4"
                  onClick={() => {
                    handleAgentChange(DEMO_AGENT.toBase58());
                    setDimension(DIM_VOLUME);
                    setThreshold(4);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function PreviewRow({
  label, value, detail,
}: { label: string; value: string; detail: string; }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{detail}</div>
    </div>
  );
}

function TrySuggestion({ desc, onClick }: { desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      → {desc}
    </button>
  );
}