import * as anchor from "@coral-xyz/anchor";
import { Program, BorshCoder, EventParser } from "@coral-xyz/anchor";
import { Cypher } from "../target/types/cypher";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const REPUTATION_SEED = "reputation";

const EV_PAYMENT_COMPLETED = 0;
const EV_PAYMENT_FAILED = 1;
const EV_PAYMENT_DISPUTED = 2;
const EV_LOAN_ON_TIME = 3;
const EV_LOAN_LATE = 4;
const EV_LOAN_DEFAULTED = 5;
const EV_VOLUME = 6;

const DIM_PAYMENT = 0;
const DIM_CREDIT = 1;
const DIM_VOLUME = 2;

describe("cypher-attestation", () => {
  console.log("cypher-attestation.ts");

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

  const agent = Keypair.generate();
  const recorderAuthority = wallet.publicKey;

  const [reputationPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), agent.publicKey.toBuffer()],
    program.programId,
  );

  console.log("Test agent:    ", agent.publicKey.toString());
  console.log("Reputation PDA:", reputationPDA.toString());

  const eventParser = new EventParser(program.programId, new BorshCoder(program.idl));

  async function attestAndParse(dimension: number, threshold: number) {
    const tx = await program.methods
      .issueAttestation(dimension, new anchor.BN(threshold))
      .accounts({ reputation: reputationPDA })
      .rpc({ commitment: "confirmed" });

    const txInfo = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const logs = txInfo?.meta?.logMessages ?? [];
    const events = [...eventParser.parseLogs(logs)];
    const attestation = events.find((e) => e.name === "attestationEvent" || e.name === "AttestationEvent");
    if (!attestation) throw new Error("AttestationEvent not found in logs");
    return attestation.data as {
      agent: anchor.web3.PublicKey;
      dimension: number;
      threshold: anchor.BN;
      score: anchor.BN;
      passes: boolean;
      timestamp: anchor.BN;
    };
  }

  async function recordN(eventType: number, n: number, amount = 0) {
    for (let i = 0; i < n; i++) {
      await program.methods
        .recordEvent(eventType, new anchor.BN(amount))
        .accounts({ reputation: reputationPDA, recorderAuthority })
        .rpc();
    }
  }

  before(async function () {
    // Fund the test agent from main wallet (devnet faucet is rate-limited)
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: agent.publicKey,
        lamports: 0.05 * LAMPORTS_PER_SOL,
      }),
    );
    await provider.sendAndConfirm(tx, []);
  });

  it("Initialize fresh reputation for test agent", async () => {
    const tx = await program.methods
      .initialize(recorderAuthority)
      .accounts({ agent: agent.publicKey })
      .signers([agent])
      .rpc();
    console.log("  initialize tx:", tx);
  });

  it("Seed a rich event profile (passes all three thresholds)", async () => {
    await recordN(EV_PAYMENT_COMPLETED, 50);
    await recordN(EV_PAYMENT_FAILED, 2);
    await recordN(EV_PAYMENT_DISPUTED, 1);

    await recordN(EV_LOAN_ON_TIME, 20);
    await recordN(EV_LOAN_LATE, 1);

    await recordN(EV_VOLUME, 1, 50000);

    console.log("  ✓ event profile seeded");
  });

  it("DIM_PAYMENT: passes threshold 7", async () => {
    const result = await attestAndParse(DIM_PAYMENT, 7);
    console.log(`  score=${result.score} threshold=${result.threshold} passes=${result.passes}`);
    if (!result.passes) throw new Error("Expected payment attestation to pass at threshold 7");
  });

  it("DIM_PAYMENT: fails threshold 10", async () => {
    const result = await attestAndParse(DIM_PAYMENT, 10);
    console.log(`  score=${result.score} threshold=${result.threshold} passes=${result.passes}`);
    if (result.passes) throw new Error("Expected payment attestation to fail at threshold 10");
  });

  it("DIM_CREDIT: passes threshold 6", async () => {
    const result = await attestAndParse(DIM_CREDIT, 6);
    console.log(`  score=${result.score} threshold=${result.threshold} passes=${result.passes}`);
    if (!result.passes) throw new Error("Expected credit attestation to pass at threshold 6");
  });

  it("DIM_VOLUME: passes tier 3", async () => {
    const result = await attestAndParse(DIM_VOLUME, 3);
    console.log(`  score=${result.score} threshold=${result.threshold} passes=${result.passes}`);
    if (!result.passes) throw new Error("Expected volume tier to be ≥3");
  });

  it("DIM_VOLUME: fails tier 4", async () => {
    const result = await attestAndParse(DIM_VOLUME, 4);
    console.log(`  score=${result.score} threshold=${result.threshold} passes=${result.passes}`);
    if (result.passes) throw new Error("Expected volume tier to NOT reach 4 with 50k");
  });
});
