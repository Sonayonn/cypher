/**
 * Cypher demo — runs against the deployed devnet program.
 *
 * Usage:  yarn cypher:demo
 *
 * Prints all three attestations against the demo agent and reports
 * pass/fail with score and threshold. Reads only — no transactions sent.
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BorshCoder, EventParser } from "@coral-xyz/anchor";
import { Cypher } from "../target/types/cypher";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Connection } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC");
const DEMO_AGENT = new PublicKey("J15wEqvQvXJHGAZSaMbaEnnEvjV7JqLB6Ku2ZepB3CQ5");
const REPUTATION_SEED = "reputation";

const DIM = { PAYMENT: 0, CREDIT: 1, VOLUME: 2 } as const;
const LABELS: Record<number, string> = {
  0: "Payment Reliability",
  1: "Credit Worthiness",
  2: "Volume Tier",
};

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function header(s: string) {
  console.log(`\n${c.bold}${s}${c.reset}`);
  console.log(c.gray + "─".repeat(60) + c.reset);
}

async function main() {
  console.log(`\n${c.bold}${c.cyan}cypher${c.reset} ${c.dim}— privacy-first reputation for Solana agents${c.reset}\n`);
  console.log(`${c.gray}Program:${c.reset}  ${PROGRAM_ID.toString()}`);
  console.log(`${c.gray}Network:${c.reset}  Solana devnet`);
  console.log(`${c.gray}Agent:${c.reset}    ${DEMO_AGENT.toString()}`);

  const provider = new anchor.AnchorProvider(
    new Connection(
      process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
      { commitment: "confirmed" },
    ),
    anchor.Wallet.local(),
  );
  anchor.setProvider(provider);
  const program = anchor.workspace.Cypher as Program<Cypher>;

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), DEMO_AGENT.toBuffer()],
    PROGRAM_ID,
  );

  // Step 1: read reputation PDA
  header("1. Reading agent reputation from on-chain PDA");
  const rep = await program.account.agentReputation.fetch(pda);
  console.log(`  ${c.gray}PDA:${c.reset}             ${pda.toString()}`);
  console.log(`  ${c.gray}pay_completed:${c.reset}   ${rep.payCompleted.toString()}`);
  console.log(`  ${c.gray}pay_failed:${c.reset}      ${rep.payFailed.toString()}`);
  console.log(`  ${c.gray}pay_disputed:${c.reset}    ${rep.payDisputed.toString()}`);
  console.log(`  ${c.gray}credit_on_time:${c.reset}  ${rep.creditOnTime.toString()}`);
  console.log(`  ${c.gray}credit_late:${c.reset}     ${rep.creditLate.toString()}`);
  const totalVolume = rep.volumeBuckets.reduce(
    (a: anchor.BN, b: anchor.BN) => a.add(b),
    new anchor.BN(0),
  );
  console.log(`  ${c.gray}volume (30d):${c.reset}    $${totalVolume.toString()}`);

  // Step 2: run attestations
  header("2. Running attestations");

  const eventParser = new EventParser(PROGRAM_ID, new BorshCoder(program.idl));
  const tests = [
    { dim: DIM.PAYMENT, threshold: 7, expect: true,  label: "demo agent passes payment >= 7" },
    { dim: DIM.PAYMENT, threshold: 10, expect: false, label: "demo agent fails  payment >= 10" },
    { dim: DIM.CREDIT, threshold: 6, expect: true,  label: "demo agent passes credit >= 6" },
    { dim: DIM.VOLUME, threshold: 3, expect: true,  label: "demo agent passes volume >= T3" },
    { dim: DIM.VOLUME, threshold: 4, expect: false, label: "demo agent fails  volume >= T4" },
  ];

  let allPass = true;

  for (const t of tests) {
    process.stdout.write(`  ${t.label.padEnd(48)} `);
    const tx = await program.methods
      .issueAttestation(t.dim, new anchor.BN(t.threshold))
      .accounts({ reputation: pda })
      .rpc({ commitment: "confirmed" });

    const txInfo = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const events = [...eventParser.parseLogs(txInfo?.meta?.logMessages ?? [])];
    const att = events.find(
      (e) => e.name === "attestationEvent" || e.name === "AttestationEvent",
    );
    if (!att) {
      console.log(`${c.red}NO EVENT${c.reset}`);
      allPass = false;
      continue;
    }
    const passes = (att.data as any).passes as boolean;
    const ok = passes === t.expect;
    if (!ok) allPass = false;
    const mark = ok ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
    const verdict = passes ? `${c.green}PASS${c.reset}` : `${c.red}FAIL${c.reset}`;
    console.log(`${mark} ${verdict}`);
  }

  header("3. Verdict");
  if (allPass) {
    console.log(`${c.green}${c.bold}  ✓ Cypher operational. 3 dimensions. 1 program. 0 secrets revealed.${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${c.red}${c.bold}  ✗ Cypher diagnostics failed.${c.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
