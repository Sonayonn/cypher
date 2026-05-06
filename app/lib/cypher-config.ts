import { PublicKey } from "@solana/web3.js";

export const CYPHER_PROGRAM_ID = new PublicKey(
  "4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC",
);

export const RPC_ENDPOINT = "https://api.devnet.solana.com";

// Demo agent — pre-seeded with the hero profile
// 50/2/1 payments, 20/1/0 loans, $50k volume
export const DEMO_AGENT = new PublicKey(
  "J15wEqvQvXJHGAZSaMbaEnnEvjV7JqLB6Ku2ZepB3CQ5",
);
export const DEMO_REPUTATION_PDA = new PublicKey(
  "3p44pz9HeCHBBUvpFbdq4nZa98Tc4PV2ZziJZktXWU5f",
);

export const REPUTATION_SEED = "reputation";

// Event types
export const EV_PAYMENT_COMPLETED = 0;
export const EV_PAYMENT_FAILED = 1;
export const EV_PAYMENT_DISPUTED = 2;
export const EV_LOAN_ON_TIME = 3;
export const EV_LOAN_LATE = 4;
export const EV_LOAN_DEFAULTED = 5;
export const EV_VOLUME = 6;

// Dimensions
export const DIM_PAYMENT = 0;
export const DIM_CREDIT = 1;
export const DIM_VOLUME = 2;

export const DIMENSION_LABELS: Record<number, string> = {
  [DIM_PAYMENT]: "Payment Reliability",
  [DIM_CREDIT]: "Credit Worthiness",
  [DIM_VOLUME]: "Transaction Volume",
};

export const DIMENSION_DESCRIPTIONS: Record<number, string> = {
  [DIM_PAYMENT]: "Score 0–10 based on completed vs failed/disputed payments",
  [DIM_CREDIT]: "Score 0–10 based on on-time vs late/defaulted loans",
  [DIM_VOLUME]: "Tier 1–4 based on 30-day transaction volume",
};

export const VOLUME_TIERS = [
  { tier: 1, label: "T1", range: "$0 – $1k" },
  { tier: 2, label: "T2", range: "$1k – $10k" },
  { tier: 3, label: "T3", range: "$10k – $100k" },
  { tier: 4, label: "T4", range: "$100k+" },
];
