import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <header className="mb-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Cypher
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Verifier widget</h1>
        <p className="text-muted-foreground mt-2">
          Add Cypher attestation to your Solana app in 30 lines.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-3">Install</h2>
        <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm">
{`yarn add @coral-xyz/anchor @solana/web3.js
# (Cypher's verify module is a single file you can copy)`}
        </pre>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-3">Use it</h2>
        <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { verifyAttestation, Dimensions } from "@/lib/cypher-verify";
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
}`}
        </pre>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-3">Three dimensions</h2>
        <ul className="space-y-3">
          <DimRow code="Dimensions.PaymentReliability" range="0–10" what="Score derived from completed vs failed/disputed payments" />
          <DimRow code="Dimensions.CreditWorthiness" range="0–10" what="Score derived from on-time vs late/defaulted loans" />
          <DimRow code="Dimensions.VolumeTier" range="1–4" what="Tier from 30-day rolling transaction volume" />
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-3">Privacy property</h2>
        <p className="text-sm text-muted-foreground">
          The verifier never learns the agent's underlying score, event counts, or volume —
          only whether the threshold is met. Cypher's reputation state lives inside MagicBlock's
          Private Ephemeral Rollup; the threshold check executes inside the TEE.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-3">What's deployed</h2>
        <dl className="text-sm space-y-2">
          <Pair label="Program ID" value="4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC" />
          <Pair label="Network" value="Solana devnet" />
          <Pair label="Demo agent" value="J15wEqvQvXJHGAZSaMbaEnnEvjV7JqLB6Ku2ZepB3CQ5" />
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">v2 roadmap</h2>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
          <li>Mainnet deploy with audited program</li>
          <li>Per-source authority — each merchant/lender signs its own events instead of one Cypher oracle</li>
          <li>TEE-signed attestations verifiable off-chain without trusting the RPC</li>
          <li>Score economics calibrated against real agent behavior data</li>
          <li>Programmatic SDK for non-Solana verifiers (e.g. fiat off-ramps)</li>
        </ul>
      </section>
    </div>
  );
}

function DimRow({ code, range, what }: { code: string; range: string; what: string }) {
  return (
    <li className="border-l-2 border-muted pl-4">
      <code className="text-sm font-mono">{code}</code>
      <span className="text-xs text-muted-foreground ml-2">({range})</span>
      <p className="text-sm text-muted-foreground mt-1">{what}</p>
    </li>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground inline">{label}: </dt>
      <dd className="font-mono text-xs inline break-all">{value}</dd>
    </div>
  );
}
