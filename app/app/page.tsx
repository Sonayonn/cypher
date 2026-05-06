"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cypher</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Privacy-first reputation layer for agents on Solana
          </p>
        </div>
        <div className="flex items-center gap-3">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
          Docs
        </Link>
        <WalletMultiButton />
        </div>
      </header>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold">Agent reputation</h2>
            {isDemo && <Badge variant="secondary">Demo agent</Badge>}
          </div>
          <p className="text-sm text-muted-foreground font-mono break-all">
            {activeAgent.toBase58()}
          </p>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <section className="mt-20">
        <h2 className="text-xl font-semibold mb-2">Three markets, one private vault</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Each demo simulates a verifier asking Cypher about the demo agent. Same agent, different threshold, different attestation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="mt-16 text-xs text-muted-foreground">
        Program ID: <span className="font-mono">4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC</span>
        <span className="mx-2">·</span>
        Network: devnet
      </div>
    </div>
  );
}

function ScoreCard({
  label, score, max, scoreLabel, footnote,
}: { label: string; score: number; max: number; scoreLabel?: string; footnote: string; }) {
  const pct = (score / max) * 100;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-4xl font-bold">
          {scoreLabel ?? score}
          {!scoreLabel && <span className="text-lg text-muted-foreground"> / {max}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{footnote}</p>
      </CardContent>
    </Card>
  );
}

function SceneLink({
  href, brand, blurb, requirement,
}: { href: string; brand: string; blurb: string; requirement: string; }) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-foreground transition-colors h-full">
        <CardHeader>
          <CardTitle className="text-base">{brand}</CardTitle>
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
