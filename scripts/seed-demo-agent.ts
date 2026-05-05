import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Cypher } from "../target/types/cypher";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPUTATION_SEED = "reputation";

const EV_PAYMENT_COMPLETED = 0;
const EV_PAYMENT_FAILED = 1;
const EV_PAYMENT_DISPUTED = 2;
const EV_LOAN_ON_TIME = 3;
const EV_LOAN_LATE = 4;
const EV_VOLUME = 6;

async function main() {
  // Provider = main wallet (the recorder authority)
  const provider = new anchor.AnchorProvider(
    new anchor.web3.Connection(
      process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
      { commitment: "confirmed" },
    ),
    anchor.Wallet.local(),
  );
  anchor.setProvider(provider);
  const program = anchor.workspace.Cypher as Program<Cypher>;
  const mainWallet = provider.wallet as anchor.Wallet;

  // Load demo agent keypair
  const demoAgentPath = path.join(os.homedir(), ".config/solana/demo-agent.json");
  const demoAgent = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(demoAgentPath, "utf-8"))),
  );

  console.log("Main wallet:", mainWallet.publicKey.toString());
  console.log("Demo agent: ", demoAgent.publicKey.toString());

  const [reputationPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), demoAgent.publicKey.toBuffer()],
    program.programId,
  );
  console.log("Reputation: ", reputationPDA.toString());

  // Step 1: fund demo agent if needed
  const balance = await provider.connection.getBalance(demoAgent.publicKey);
  if (balance < 0.05 * LAMPORTS_PER_SOL) {
    console.log("\nFunding demo agent (0.05 SOL)...");
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: mainWallet.publicKey,
        toPubkey: demoAgent.publicKey,
        lamports: 0.05 * LAMPORTS_PER_SOL,
      }),
    );
    await provider.sendAndConfirm(tx, []);
    console.log("  funded");
  } else {
    console.log("\nDemo agent already funded (" + balance / LAMPORTS_PER_SOL + " SOL)");
  }

  // Step 2: initialize reputation if needed
  const existing = await provider.connection.getAccountInfo(reputationPDA);
  if (existing) {
    console.log("\nReputation already initialized — re-seeding will accumulate on top!");
    console.log("Tip: change the demo agent (regenerate keypair) for a clean state.");
  } else {
    console.log("\nInitializing reputation PDA...");
    const tx = await program.methods
      .initialize(mainWallet.publicKey)
      .accounts({ agent: demoAgent.publicKey })
      .signers([demoAgent])
      .rpc();
    console.log("  initialize tx:", tx);
  }

  // Step 3: seed events
  async function recordN(eventType: number, n: number, amount = 0, label = "") {
    process.stdout.write(`  recording ${n}x ${label}... `);
    for (let i = 0; i < n; i++) {
      await program.methods
        .recordEvent(eventType, new anchor.BN(amount))
        .accounts({
          reputation: reputationPDA,
          recorderAuthority: mainWallet.publicKey,
        })
        .rpc();
    }
    console.log("done");
  }

  console.log("\nSeeding event profile...");
  // Payment Reliability target: ~8/10
  await recordN(EV_PAYMENT_COMPLETED, 50, 0, "payment_completed");
  await recordN(EV_PAYMENT_FAILED, 2, 0, "payment_failed");
  await recordN(EV_PAYMENT_DISPUTED, 1, 0, "payment_disputed");

  // Credit Worthiness target: ~7/10
  await recordN(EV_LOAN_ON_TIME, 20, 0, "loan_on_time");
  await recordN(EV_LOAN_LATE, 1, 0, "loan_late");

  // Volume Tier target: T3 (10k–100k)
  await recordN(EV_VOLUME, 1, 50000, "volume ($50k)");

  // Step 4: print final state
  const rep = await program.account.agentReputation.fetch(reputationPDA);
  const totalVolume = rep.volumeBuckets.reduce(
    (a: anchor.BN, b: anchor.BN) => a.add(b),
    new anchor.BN(0),
  );

  console.log("\n=== Demo Agent State ===");
  console.log("Wallet:           ", demoAgent.publicKey.toString());
  console.log("Reputation PDA:   ", reputationPDA.toString());
  console.log("Recorder auth:    ", rep.recorderAuthority.toString());
  console.log("");
  console.log("pay_completed:    ", rep.payCompleted.toString());
  console.log("pay_failed:       ", rep.payFailed.toString());
  console.log("pay_disputed:     ", rep.payDisputed.toString());
  console.log("credit_on_time:   ", rep.creditOnTime.toString());
  console.log("credit_late:      ", rep.creditLate.toString());
  console.log("credit_defaulted: ", rep.creditDefaulted.toString());
  console.log("volume_total:     $" + totalVolume.toString());
  console.log("");
  console.log("Expected attestations:");
  console.log("  DIM_PAYMENT (threshold 7): PASS (score ~8)");
  console.log("  DIM_CREDIT  (threshold 6): PASS (score ~7)");
  console.log("  DIM_VOLUME  (threshold 3): PASS (tier 3)");
  console.log("");
  console.log("Save these for Day 5:");
  console.log(`  DEMO_AGENT=${demoAgent.publicKey.toString()}`);
  console.log(`  REPUTATION_PDA=${reputationPDA.toString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
