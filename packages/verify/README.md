# @cypher-protocol/verify

> Privacy-first reputation verification for Solana agents.

Drop-in client for [Cypher](https://cypher-devnet.vercel.app) — a privacy-first reputation layer for AI agents on Solana, built on MagicBlock's Private Ephemeral Rollup.

## Install

```bash
npm install @sonayonn/cypher-verify @coral-xyz/anchor @solana/web3.js
```

## Quickstart

```ts
import { verifyAttestation, Dimensions } from "@sonayonn/cypher-verify";
import { PublicKey } from "@solana/web3.js";

const result = await verifyAttestation({
  agent: new PublicKey("J15w..."),
  dimension: Dimensions.PaymentReliability,
  threshold: 7,
  wallet,
  connection,
  idl,
});

if (result.passes) {
  // Grant access. The agent's actual score is not revealed.
}
```

## Three dimensions

| Dimension | Range | What it measures |
|---|---|---|
| `PaymentReliability` | 0–10 | Completed vs failed/disputed payments |
| `CreditWorthiness` | 0–10 | On-time vs late/defaulted loans |
| `VolumeTier` | 1–4 | 30-day rolling transaction volume |

## Privacy property

Verifiers learn whether the threshold is met. Nothing else.

The agent's underlying counts, exact volume, and raw scores never leave Cypher's protocol surface. The threshold check executes inside MagicBlock's Trusted Execution Environment.

## Deployed program

- **Program ID:** `4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC`
- **Network:** Solana devnet
- **Demo agent:** `J15wEqvQvXJHGAZSaMbaEnnEvjV7JqLB6Ku2ZepB3CQ5`
- **Live demo:** https://cypher-devnet.vercel.app

## License

MIT
