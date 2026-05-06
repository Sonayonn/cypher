"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Lock, Zap, Menu, X } from "lucide-react";
import { CypherLogo } from "@/components/cypher-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-50">
        <div className="px-6 md:px-10 py-5 flex items-center justify-between">
          <CypherLogo size="lg" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/console" className="text-muted-foreground hover:text-foreground transition-colors">
              Verifier
            </Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <a
              href="https://github.com/Sonayonn/cypher.git"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-background">
            <div className="px-6 py-4 flex flex-col gap-1 text-sm font-medium">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/console"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Verifier
              </Link>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <a
                href="https://github.com/Sonayonn/cypher.git"
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="px-6 md:px-10 pt-24 md:pt-32 pb-20 md:pb-28 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live on Solana devnet
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-[-0.04em] leading-[1.02] mb-8 max-w-5xl">
          The missing primitive
          <br />
          for the{" "}
          <span style={{ color: "var(--cypher-accent)" }}>agent economy.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-12">
          Cypher is a privacy-first reputation layer for AI agents on Solana.
          Three dimensions. One private vault. Every market on the MagicBlock
          stack — unlocked.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="gap-2 h-12 px-6 text-base font-medium"
              style={{
                backgroundColor: "var(--cypher-accent)",
                color: "var(--cypher-accent-fg)",
              }}
            >
              View live demo <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="outline" className="h-12 px-6 text-base font-medium">
              Read the docs
            </Button>
          </Link>
        </div>
      </section>

      {/* Three pillars */}
      <section className="px-6 md:px-10 py-24 max-w-6xl mx-auto border-t border-border">
        <div
          className="text-xs font-semibold uppercase tracking-[0.14em] mb-4"
          style={{ color: "var(--cypher-accent)" }}
        >
          What Cypher does
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-16 max-w-3xl">
          A private financial passport, in three numbers.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PillarCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Records privately"
            blurb="Behavioral events (payments, loans, volume) recorded inside MagicBlock's Private Ephemeral Rollup. Counterparties never see raw history."
          />
          <PillarCard
            icon={<Zap className="h-5 w-5" />}
            title="Computes inside the TEE"
            blurb="Three score dimensions calculated entirely inside the Trusted Execution Environment. The TEE attests; nothing leaks."
          />
          <PillarCard
            icon={<Lock className="h-5 w-5" />}
            title="Reveals only the answer"
            blurb="Verifiers receive a signed yes/no on a threshold check. The agent's actual score, event counts, and volume stay private."
          />
        </div>
      </section>

      {/* Three markets */}
      <section className="px-6 md:px-10 py-24 max-w-6xl mx-auto border-t border-border">
        <div
          className="text-xs font-semibold uppercase tracking-[0.14em] mb-4"
          style={{ color: "var(--cypher-accent)" }}
        >
          The platform unlock
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5 max-w-3xl">
          Three RFPs. One missing primitive.
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-12">
          Every privacy use case on MagicBlock&apos;s roadmap silently depends on
          agent reputation existing. Cypher is the layer underneath.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SceneCard
            href="/scenes/velo-pay"
            tone="emerald"
            label="Private MPP"
            brand="Velo Pay"
            blurb="Merchant settles a $13k invoice with an agent. Requires payment reliability ≥ 7."
          />
          <SceneCard
            href="/scenes/orbit-credit"
            tone="blue"
            label="Undercollateralized lending"
            brand="Orbit Credit"
            blurb="Agent applies for an $80k working capital line. Requires credit worthiness ≥ 6."
          />
          <SceneCard
            href="/scenes/atlas-otc"
            tone="violet"
            label="Sealed-bid auction"
            brand="Atlas OTC"
            blurb="Agent enters a private OTC lot. Restricted to volume tier ≥ T3."
          />
        </div>
      </section>

      {/* Code snippet */}
      <section className="px-6 md:px-10 py-24 max-w-6xl mx-auto border-t border-border">
        <div
          className="text-xs font-semibold uppercase tracking-[0.14em] mb-4"
          style={{ color: "var(--cypher-accent)" }}
        >
          Drop-in for developers
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5 max-w-3xl">
          Add reputation to your app in 30 lines.
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-10">
          Cypher ships as a primitive. Any Solana app gates access on
          attestations with a single function call.
        </p>

        <pre className="bg-zinc-950 text-zinc-100 p-7 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border border-zinc-800">
{`import { verifyAttestation, Dimensions } from "@cypher/verify";

const result = await verifyAttestation({
  agent: agentPubkey,
  dimension: Dimensions.PaymentReliability,
  threshold: 7,
  wallet,
  connection,
});

if (result.passes) {
  // grant access — agent's actual score is not revealed
  proceed();
}`}
        </pre>

        <div className="mt-7">
          <Link
            href="/docs"
            className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
            style={{ color: "var(--cypher-accent)" }}
          >
            View full integration docs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 py-32 max-w-6xl mx-auto border-t border-border text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] leading-[1.05] mb-6">
          Ready to see it work?
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-12 max-w-xl mx-auto">
          Walk through three live attestations against a pre-seeded agent on
          Solana devnet. Real on-chain transactions. Real privacy property.
        </p>
        <Link href="/dashboard">
          <Button
            size="lg"
            className="gap-2 h-12 px-6 text-base font-medium"
            style={{
              backgroundColor: "var(--cypher-accent)",
              color: "var(--cypher-accent-fg)",
            }}
          >
            Open the dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-10 border-t border-border text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span>Program:</span>
          <code className="font-mono text-foreground/70">4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC</code>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/console" className="hover:text-foreground transition-colors">Verifier</Link>
        </div>
      </footer>
    </div>
  );
}

function PillarCard({
  icon,
  title,
  blurb,
}: {
  icon: React.ReactNode;
  title: string;
  blurb: string;
}) {
  return (
    <Card className="border-border hover:border-foreground/20 transition-colors">
      <CardHeader>
        <div
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3"
          style={{
            backgroundColor: "var(--cypher-accent-soft)",
            color: "var(--cypher-accent)",
          }}
        >
          {icon}
        </div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{blurb}</p>
      </CardContent>
    </Card>
  );
}

function SceneCard({
  href,
  tone,
  label,
  brand,
  blurb,
}: {
  href: string;
  tone: "emerald" | "blue" | "violet";
  label: string;
  brand: string;
  blurb: string;
}) {
  const toneClasses: Record<string, string> = {
    emerald: "border-emerald-500/30 hover:border-emerald-500/60",
    blue: "border-blue-500/30 hover:border-blue-500/60",
    violet: "border-violet-500/30 hover:border-violet-500/60",
  };
  const dotClasses: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
  };
  return (
    <Link href={href} className="block group">
      <Card className={`h-full transition-colors ${toneClasses[tone]}`}>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[tone]}`} />
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              {label}
            </CardDescription>
          </div>
          <CardTitle className="text-xl font-semibold">{brand}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{blurb}</p>
          <div className="mt-4 text-xs font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "var(--cypher-accent)" }}>
            See it in action <ArrowRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
