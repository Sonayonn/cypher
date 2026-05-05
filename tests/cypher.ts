import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Cypher } from "../target/types/cypher";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const REPUTATION_SEED = "reputation";

// Event type constants — must match lib.rs
const EV_PAYMENT_COMPLETED = 0;
const EV_PAYMENT_FAILED = 1;
const EV_PAYMENT_DISPUTED = 2;
const EV_LOAN_ON_TIME = 3;
const EV_LOAN_LATE = 4;
const EV_LOAN_DEFAULTED = 5;
const EV_VOLUME = 6;

describe("cypher", () => {
  console.log("cypher.ts");

  const provider = new anchor.AnchorProvider(
    new anchor.web3.Connection(
      process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
      { commitment: "confirmed" }
    ),
    anchor.Wallet.local(),
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.Cypher as Program<Cypher>;
  const wallet = provider.wallet as anchor.Wallet;

  // For Day 3, the same wallet is both "agent" and "recorder authority".
  // (In production we'd have a separate Cipher oracle key; for the demo this is fine.)
  const agent = wallet.publicKey;
  const recorderAuthority = wallet.publicKey;

  const [reputationPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
    program.programId,
  );

  console.log("Program ID:    ", program.programId.toString());
  console.log("Agent:         ", agent.toString());
  console.log("Reputation PDA:", reputationPDA.toString());

  before(async function () {
    const balance = await provider.connection.getBalance(agent);
    console.log("Wallet balance:", balance / LAMPORTS_PER_SOL, "SOL\n");
  });

  it("Initialize reputation PDA", async () => {
    const start = Date.now();

    // Skip if already initialized (re-runs)
    const existing = await provider.connection.getAccountInfo(reputationPDA);
    if (existing) {
      console.log("  (already initialized — skipping)");
      return;
    }

    const tx = await program.methods
      .initialize(recorderAuthority)
      .accounts({ agent })
      .rpc();
    console.log(`  ${Date.now() - start}ms tx: ${tx}`);
  });

  it("Record payment_completed", async () => {
    await program.methods
      .recordEvent(EV_PAYMENT_COMPLETED, new anchor.BN(0))
      .accounts({
        reputation: reputationPDA,
        recorderAuthority,
      })
      .rpc();
  });

  it("Record payment_failed", async () => {
    await program.methods
      .recordEvent(EV_PAYMENT_FAILED, new anchor.BN(0))
      .accounts({
        reputation: reputationPDA,
        recorderAuthority,
      })
      .rpc();
  });

  it("Record payment_disputed", async () => {
    await program.methods
      .recordEvent(EV_PAYMENT_DISPUTED, new anchor.BN(0))
      .accounts({
        reputation: reputationPDA,
        recorderAuthority,
      })
      .rpc();
  });

  it("Record loan_on_time", async () => {
    await program.methods
      .recordEvent(EV_LOAN_ON_TIME, new anchor.BN(0))
      .accounts({
        reputation: reputationPDA,
        recorderAuthority,
      })
      .rpc();
  });

  it("Record loan_late", async () => {
    await program.methods
      .recordEvent(EV_LOAN_LATE, new anchor.BN(0))
      .accounts({
        reputation: reputationPDA,
        recorderAuthority,
      })
      .rpc();
  });

  it("Record loan_defaulted", async () => {
    await program.methods
      .recordEvent(EV_LOAN_DEFAULTED, new anchor.BN(0))
      .accounts({
        reputation: reputationPDA,
        recorderAuthority,
      })
      .rpc();
  });

  it("Record volume events", async () => {
    // Three volume events totaling $5,000 — should put agent in tier 2 (1k–10k)
    await program.methods
      .recordEvent(EV_VOLUME, new anchor.BN(2000))
      .accounts({ reputation: reputationPDA, recorderAuthority })
      .rpc();
    await program.methods
      .recordEvent(EV_VOLUME, new anchor.BN(2500))
      .accounts({ reputation: reputationPDA, recorderAuthority })
      .rpc();
    await program.methods
      .recordEvent(EV_VOLUME, new anchor.BN(500))
      .accounts({ reputation: reputationPDA, recorderAuthority })
      .rpc();
  });

  it("Verify final state", async () => {
    const rep = await program.account.agentReputation.fetch(reputationPDA);
    console.log("\n  Final reputation state:");
    console.log("  agent:           ", rep.agent.toString());
    console.log("  recorder:        ", rep.recorderAuthority.toString());
    console.log("  pay_completed:   ", rep.payCompleted.toString());
    console.log("  pay_failed:      ", rep.payFailed.toString());
    console.log("  pay_disputed:    ", rep.payDisputed.toString());
    console.log("  credit_on_time:  ", rep.creditOnTime.toString());
    console.log("  credit_late:     ", rep.creditLate.toString());
    console.log("  credit_defaulted:", rep.creditDefaulted.toString());
    const totalVolume = rep.volumeBuckets.reduce(
      (a: anchor.BN, b: anchor.BN) => a.add(b),
      new anchor.BN(0),
    );
    console.log("  volume_total:    ", totalVolume.toString());
    console.log("  bucket_head:     ", rep.bucketHead);
    console.log("  bucket_head_day: ", rep.bucketHeadDay);

    // Hard assertions
    if (!rep.payCompleted.eqn(1)) throw new Error("pay_completed should be 1");
    if (!rep.payFailed.eqn(1)) throw new Error("pay_failed should be 1");
    if (!rep.payDisputed.eqn(1)) throw new Error("pay_disputed should be 1");
    if (!rep.creditOnTime.eqn(1)) throw new Error("credit_on_time should be 1");
    if (!rep.creditLate.eqn(1)) throw new Error("credit_late should be 1");
    if (!rep.creditDefaulted.eqn(1)) throw new Error("credit_defaulted should be 1");
    if (!totalVolume.eqn(5000)) throw new Error("volume should sum to 5000");
    console.log("  ✓ all event counts match expected\n");
  });
});