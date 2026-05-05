# Cypher Frontend Contract

## Deployed program
- Program ID: `4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC`
- Network: Solana devnet
- IDL: fetch from chain via Anchor (or read `target/idl/cypher.json`)

## Demo agent (THE hero of the demo)
- Wallet pubkey: `J15wEqvQvXJHGAZSaMbaEnnEvjV7JqLB6Ku2ZepB3CQ5` (wallet) / `3p44pz9HeCHBBUvpFbdq4nZa98Tc4PV2ZziJZktXWU5f` (PDA)
- Reputation PDA: `J15wEqvQvXJHGAZSaMbaEnnEvjV7JqLB6Ku2ZepB3CQ5` (wallet) / `3p44pz9HeCHBBUvpFbdq4nZa98Tc4PV2ZziJZktXWU5f` (PDA)
- Recorder authority: `<your main wallet pubkey>`
- Profile: 50/2/1 payments, 20/1/0 loans, $50k volume

## Three demo dimensions
| Constant | Value | Threshold meaning |
|---|---|---|
| DIM_PAYMENT = 0 | score 0–10 | Pass if score >= threshold |
| DIM_CREDIT = 1 | score 0–10 | Pass if score >= threshold |
| DIM_VOLUME = 2 | tier 1–4 | Pass if tier >= threshold |

## Verifier-side flow

```ts
const tx = await program.methods
  .issueAttestation(dimension, new BN(threshold))
  .accounts({ reputation: reputationPDA })
  .rpc();

const txInfo = await connection.getTransaction(tx, {
  commitment: "confirmed",
  maxSupportedTransactionVersion: 0,
});

const events = [...eventParser.parseLogs(txInfo.meta.logMessages)];
const attestation = events.find(e => e.name === "AttestationEvent");
// attestation.data: { agent, dimension, threshold, score, passes, timestamp }
```

## Three mock consumer scenes (Day 5)

### Scene 1 — Private MPP merchant checkout
- Brand: minimalist e-commerce
- Threshold gate: payment_reliability >= 7
- Action label: "Approve payment"
- Result language: "Verified merchant standing"

### Scene 2 — Undercollateralized lender
- Brand: fintech green
- Threshold gate: credit_worthiness >= 6
- Action label: "Approve loan"
- Result language: "Loan tier unlocked"

### Scene 3 — Private OTC auction
- Brand: dark / financial
- Threshold gate: volume_tier >= 3
- Action label: "Enter auction"
- Result language: "Eligible for tier 3+ auctions"

## Agent dashboard

Reads:
- All counter fields from AgentReputation
- Computes "what would I attest at threshold X" client-side using the same scoring constants

Writes: nothing (the dashboard is read-only — events come from the recorder authority)

## Verifier widget (drop-in for other developers)

```ts
import { verifyAttestation } from "./cypher-verify";

const result = await verifyAttestation({
  agent: "Pubkey...",
  dimension: 0,           // DIM_PAYMENT
  threshold: 7,
  rpcUrl: "https://api.devnet.solana.com",
});

if (result.passes) {
  // grant access
}
```

Internally: same flow as above — sends issue_attestation tx, parses event, returns `{passes, score, threshold, timestamp}`.

## Privacy story for the script

- Verifier learns: "yes this agent passes" + the threshold they asked about
- Verifier does NOT learn: actual score, underlying event counts, volume amount
- This is the TEE's job during delegation; for the live demo we can run on base layer for clarity, but the architecture supports private execution end-to-end (proven in tests/cypher-tee.ts).
