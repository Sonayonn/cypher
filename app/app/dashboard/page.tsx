"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CypherWalletButton } from "@/components/cypher-wallet-button";
import { PublicKey } from "@solana/web3.js";

import {
  fetchReputation,
  AgentReputation,
  calcPaymentScore,
  calcCreditScore,
  calcVolumeTier,
  calcVolumeTotal,
} from "@/lib/cypher-client";
import {
  DEMO_AGENT,
  DIMENSION_LABELS,
  DIM_PAYMENT,
  DIM_CREDIT,
  DIM_VOLUME,
} from "@/lib/cypher-config";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CypherLogo } from "@/components/cypher-logo";

export default function DashboardPage() {
  const { connection } = useConnection();
  const { publicKey: walletPubkey } = useWallet();
  const [rep, setRep] = useState<AgentReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAgent, setActiveAgent] = useState<PublicKey>(DEMO_AGENT);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReputation(connection, activeAgent).then((r) => {
      if (!cancelled) {
        setRep(r);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [connection, activeAgent]);

  const isDemo = activeAgent.equals(DEMO_AGENT);
  const canSwitch = walletPubkey && !walletPubkey.equals(DEMO_AGENT);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-border sticky top-0 bg-background/80 backdrop-blur z-50">
        <CypherLogo size="md" />
        <div className="flex items-center gap-6">
          <Link href="/console" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Verifier
          </Link>
          <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <CypherWalletButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        {/* Page title */}
        <div className="mb-12">
          <div
            className="text-xs font-semibold uppercase tracking-[0.14em] mb-3"
            style={{ color: "var(--cypher-accent)" }}
          >
            Agent reputation
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            {isDemo ? "Demo agent's private vault" : "Your private vault"}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Three dimensions, scored privately, attestable on demand.
          </p>
        </div>

        {/* Agent surface */}
        <div className="mb-10 flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            {isDemo && (
              <Badge
                className="font-medium"
                style={{
                  backgroundColor: "var(--cypher-accent-soft)",
                  color: "var(--cypher-accent)",
                  borderColor: "var(--cypher-accent-border)",
                }}
              >
                Demo agent
              </Badge>
            )}
            <span className="text-xs text-muted-foreground font-mono break-all">
              {activeAgent.toBase58()}
            </span>
          </div>
          {canSwitch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveAgent(isDemo ? walletPubkey : DEMO_AGENT)}
            >
              {isDemo ? "View my reputation" : "View demo agent"}
            </Button>
          )}
        </div>

        {/* Score cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </div>
        ) : !rep ? (
          <Card>
            <CardHeader>
              <CardTitle>No reputation found</CardTitle>
              <CardDescription>
                This agent has not been initialized in Cypher yet.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ScoreCard
              label={DIMENSION_LABELS[DIM_PAYMENT]}
              score={calcPaymentScore(rep)}
              max={10}
              footnote={`${rep.payCompleted.toString()} completed · ${rep.payFailed.toString()} failed · ${rep.payDisputed.toString()} disputed`}
            />
            <ScoreCard
              label={DIMENSION_LABELS[DIM_CREDIT]}
              score={calcCreditScore(rep)}
              max={10}
              footnote={`${rep.creditOnTime.toString()} on-time · ${rep.creditLate.toString()} late · ${rep.creditDefaulted.toString()} defaulted`}
            />
            <ScoreCard
              label={DIMENSION_LABELS[DIM_VOLUME]}
              score={calcVolumeTier(rep)}
              max={4}
              scoreLabel={`Tier ${calcVolumeTier(rep)}`}
              footnote={`$${calcVolumeTotal(rep).toLocaleString()} volume (30d)`}
            />
          </div>
        )}

        {/* Three markets */}
        <section className="mt-24">
          <div
            className="text-xs font-semibold uppercase tracking-[0.14em] mb-3"
            style={{ color: "var(--cypher-accent)" }}
          >
            Three markets, one private vault
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-[1.1] mb-3">
            See attestations in action.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            Each demo simulates a verifier asking Cypher about the demo agent.
            Same agent, different threshold, different attestation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SceneLink
              href="/scenes/velo-pay"
              brand="Velo Pay"
              blurb="Private MPP merchant checkout"
              requirement="Payment Reliability ≥ 7"
            />
            <SceneLink
              href="/scenes/orbit-credit"
              brand="Orbit Credit"
              blurb="Undercollateralized lending"
              requirement="Credit Worthiness ≥ 6"
            />
            <SceneLink
              href="/scenes/atlas-otc"
              brand="Atlas OTC"
              blurb="Sealed-bid private auction"
              requirement="Volume Tier ≥ T3"
            />
          </div>
        </section>

        {/* Footer info */}
        <div className="mt-20 pt-6 border-t border-border text-xs text-muted-foreground">
          Program ID:{" "}
          <code className="font-mono">4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC</code>
          <span className="mx-2">·</span>
          Network: devnet
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label, score, max, scoreLabel, footnote,
}: { label: string; score: number; max: number; scoreLabel?: string; footnote: string; }) {
  const pct = (score / max) * 100;
  return (
    <Card className="border-border hover:border-foreground/30 transition-colors">
      <CardHeader className="pb-3">
        <CardDescription className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </CardDescription>
        <CardTitle className="text-5xl font-bold tracking-[-0.02em] mt-1">
          {scoreLabel ?? score}
          {!scoreLabel && (
            <span className="text-xl text-muted-foreground font-medium"> / {max}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: "var(--cypher-accent)",
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{footnote}</p>
      </CardContent>
    </Card>
  );
}

function SceneLink({
  href, brand, blurb, requirement,
}: { href: string; brand: string; blurb: string; requirement: string; }) {
  return (
    <Link href={href} className="block group">
      <Card className="hover:border-foreground/30 transition-colors h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{brand}</CardTitle>
          <CardDescription>{blurb}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Gate: <span className="font-mono">{requirement}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}