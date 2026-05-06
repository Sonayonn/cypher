import Link from "next/link";
import { CypherLogo } from "@/components/cypher-logo";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-border sticky top-0 bg-background/80 backdrop-blur z-50">
        <CypherLogo size="md" />
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/console" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Verifier
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
        {/* Hero */}
        <div className="mb-16">
          <div
            className="text-xs font-semibold uppercase tracking-[0.14em] mb-3"
            style={{ color: "var(--cypher-accent)" }}
          >
            Developer docs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Verifier widget
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Add Cypher attestation to your Solana app in 30 lines.
          </p>
        </div>

        <Section title="Install">
          <Code>{`yarn add @coral-xyz/anchor @solana/web3.js
# (Cypher's verify module is a single file you can copy)`}</Code>
        </Section>

        <Section title="Use it">
          <Code>{`import { verifyAttestation, Dimensions } from "@/lib/cypher-verify";
import { PublicKey } from "@solana/web3.js";

// In your verifier flow (e.g. checkout, lending, auction entry):
const result = await verifyAttestation({
  agent: new PublicKey(agentPubkey),
  dimension: Dimensions.PaymentReliability,
  threshold: 7,
  wallet,        // any wallet-adapter wallet
  connection,    // Solana RPC connection
});

if (result.passes) {
  // Grant access. The actual score is not revealed.
  proceedWithCheckout();
} else {
  rejectWithReason("Payment reliability threshold not met");
}`}</Code>
        </Section>

        <Section title="Three dimensions">
          <ul className="space-y-4">
            <DimRow code="Dimensions.PaymentReliability" range="0–10" what="Score derived from completed vs failed/disputed payments" />
            <DimRow code="Dimensions.CreditWorthiness" range="0–10" what="Score derived from on-time vs late/defaulted loans" />
            <DimRow code="Dimensions.VolumeTier" range="1–4" what="Tier from 30-day rolling transaction volume" />
          </ul>
        </Section>

        <Section title="Privacy property">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The verifier never learns the agent&apos;s underlying score, event
            counts, or volume — only whether the threshold is met.
            Cypher&apos;s reputation state lives inside MagicBlock&apos;s
            Private Ephemeral Rollup; the threshold check executes inside the
            TEE.
          </p>
        </Section>

        <Section title="What's deployed">
          <dl className="text-sm space-y-2.5">
            <Pair label="Program ID" value="4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC" />
            <Pair label="Network" value="Solana devnet" />
            <Pair label="Demo agent" value="J15wEqvQvXJHGAZSaMbaEnnEvjV7JqLB6Ku2ZepB3CQ5" />
          </dl>
        </Section>

        <Section title="FAQ">
          <div className="space-y-7 text-sm">
            <FAQ
              q="Is Cypher live on mainnet?"
              a="Not yet — currently deployed on Solana devnet. The program, scoring math, attestation flow, and TEE integration are all production-quality. Mainnet deployment is gated on (1) audit and (2) replacing the centralized recorder model with per-source authority. See v2 roadmap below."
            />
            <FAQ
              q="Who is allowed to record events for an agent?"
              a="In the current version, a single oracle (Cypher) signs all record_event calls. This is sufficient for the demo and for trusted-recorder use cases. v2 introduces per-source authority where each event source — a merchant, a lender, an auction — signs its own events with its own key, removing the central trust assumption."
            />
            <FAQ
              q="Do verifiers learn anything besides pass/fail?"
              a="No. The on-chain AttestationEvent contains the score, but it's emitted only inside the verifier's own transaction logs. The protocol is designed so that the agent's underlying counts and volume never leave Cypher — only the boolean answer to the threshold check reaches the verifier's application logic."
            />
            <FAQ
              q="Where does the privacy actually live?"
              a="Inside MagicBlock's Private Ephemeral Rollup (PER) — a Solana ephemeral rollup that runs inside an Intel TDX Trusted Execution Environment. While delegated, the agent's reputation PDA is held in the TEE; events are recorded there; threshold checks execute there. State commits back to base layer only when the agent undelegates."
            />
            <FAQ
              q="What does an attestation cost?"
              a="A few thousand lamports per attestation transaction (~$0.00001 USD). PDA rent for an agent's reputation is ~0.003 SOL one-time. Cypher imposes no protocol fees in v1."
            />
            <FAQ
              q="How is this different from a traditional reputation system?"
              a="Traditional reputation systems either expose all underlying data (privacy violation) or live behind opaque APIs (trust violation). Cypher is on-chain — anyone can verify the program logic — but the data lives in a TEE-backed rollup. Verifiers get cryptographic-grade trust about the answer without ever seeing the inputs."
            />
            <FAQ
              q="Can my app integrate Cypher today?"
              a="Yes — copy lib/cypher-verify.ts and call verifyAttestation(). The integration is one function call. The agent has to exist in Cypher (their reputation PDA initialized) — for the demo we pre-seed one; in production this would happen through agent onboarding flows (planned for v2 npm SDK)."
            />
          </div>
        </Section>

        <Section title="v2 roadmap">
          <ul className="text-sm text-muted-foreground space-y-2.5 list-disc pl-5">
            <li>Mainnet deploy with audited program</li>
            <li>Per-source authority — each merchant/lender signs its own events instead of one Cypher oracle</li>
            <li>TEE-signed attestations verifiable off-chain without trusting the RPC</li>
            <li>Score economics calibrated against real agent behavior data</li>
            <li>Programmatic SDK for non-Solana verifiers (e.g. fiat off-ramps)</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="text-2xl font-bold tracking-[-0.02em] mb-5">{title}</h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-zinc-950 text-zinc-100 p-5 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border border-zinc-800">
      {children}
    </pre>
  );
}

function DimRow({ code, range, what }: { code: string; range: string; what: string }) {
  return (
    <li
      className="border-l-2 pl-4 py-1"
      style={{ borderColor: "var(--cypher-accent-border)" }}
    >
      <code className="text-sm font-mono font-semibold" style={{ color: "var(--cypher-accent)" }}>{code}</code>
      <span className="text-xs text-muted-foreground ml-2">({range})</span>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{what}</p>
    </li>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-mono text-xs break-all">{value}</dd>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="font-semibold mb-2">{q}</div>
      <p className="text-muted-foreground leading-relaxed">{a}</p>
    </div>
  );
}