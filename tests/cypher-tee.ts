import * as anchor from "@coral-xyz/anchor";
import { Program, BorshCoder, EventParser, web3 } from "@coral-xyz/anchor";
import { Cypher } from "../target/types/cypher";
import { Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import {
  GetCommitmentSignature,
  getAuthToken,
  TX_LOGS_FLAG,
  PERMISSION_SEED,
  PERMISSION_PROGRAM_ID,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import * as nacl from "tweetnacl";

const REPUTATION_SEED = "reputation";

const EV_PAYMENT_COMPLETED = 0;
const EV_VOLUME = 6;

const DIM_PAYMENT = 0;
const DIM_VOLUME = 2;

// TEE validator pubkey for devnet (same as private-counter example used)
const TEE_VALIDATOR = new web3.PublicKey("MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo");

describe("cypher-tee", () => {
  console.log("cypher-tee.ts");

  const baseProvider = new anchor.AnchorProvider(
    new anchor.web3.Connection(
      process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
      { commitment: "confirmed" }
    ),
    anchor.Wallet.local(),
  );
  anchor.setProvider(baseProvider);

  const teeUrl = "https://devnet-tee.magicblock.app";
  const teeWsUrl = "wss://devnet-tee.magicblock.app";

  let teeProvider = new anchor.AnchorProvider(
    new anchor.web3.Connection(teeUrl, { commitment: "confirmed" }),
    anchor.Wallet.local(),
  );

  const program = anchor.workspace.Cypher as Program<Cypher>;
  const wallet = baseProvider.wallet as anchor.Wallet;

  // We use the main wallet as the agent here (so we can sign instructions on the TEE
  // ourselves — the test agent can't sign without being the wallet).
  const agent = wallet.publicKey;
  const recorderAuthority = wallet.publicKey;

  const [reputationPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
    program.programId,
  );

  const [permissionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(PERMISSION_SEED), reputationPDA.toBuffer()],
    PERMISSION_PROGRAM_ID,
  );

  console.log("Program:        ", program.programId.toString());
  console.log("Agent (= wallet):", agent.toString());
  console.log("Reputation PDA: ", reputationPDA.toString());
  console.log("Permission PDA: ", permissionPDA.toString());

  const eventParser = new EventParser(program.programId, new BorshCoder(program.idl));

  before(async function () {
    const balance = await baseProvider.connection.getBalance(agent);
    console.log("Wallet balance:", balance / LAMPORTS_PER_SOL, "SOL\n");

    // Get TEE auth token + rebuild ER provider with it
    const payer = wallet.payer;
    const authToken = await getAuthToken(
      teeUrl,
      payer.publicKey,
      (message: Uint8Array) =>
        Promise.resolve(nacl.sign.detached(message, payer.secretKey)),
    );
    console.log("TEE token (first 20):", authToken.token.substring(0, 20) + "...");

    teeProvider = new anchor.AnchorProvider(
      new anchor.web3.Connection(`${teeUrl}?token=${authToken.token}`, {
        wsEndpoint: `${teeWsUrl}?token=${authToken.token}`,
        commitment: "confirmed",
      }),
      anchor.Wallet.local(),
    );
  });

  it("Ensure reputation exists on base layer", async () => {
    const existing = await baseProvider.connection.getAccountInfo(reputationPDA);
    if (existing) {
      console.log("  (reputation already exists, reusing)");
      return;
    }
    const tx = await program.methods
      .initialize(recorderAuthority)
      .accounts({ agent })
      .rpc();
    console.log("  initialize tx:", tx);
  });

  it("Record event on base layer (payment_completed)", async () => {
    const tx = await program.methods
      .recordEvent(EV_PAYMENT_COMPLETED, new anchor.BN(0))
      .accounts({ reputation: reputationPDA, recorderAuthority })
      .rpc();
    console.log("  base layer record tx:", tx);
  });

  it("Delegate reputation + permission to TEE", async () => {
    const start = Date.now();
    const tx = await program.methods
      .delegate([{ flags: TX_LOGS_FLAG, pubkey: agent }])
      .accounts({
        payer: agent,
        validator: TEE_VALIDATOR,
      })
      .rpc({ skipPreflight: true });
    console.log(`  ${Date.now() - start}ms delegate tx: ${tx}`);
    // Wait for delegation to propagate to the TEE
    await new Promise((r) => setTimeout(r, 3000));
  });

  it("Record event on TEE (private)", async () => {
    const start = Date.now();
    let tx = await program.methods
      .recordEvent(EV_PAYMENT_COMPLETED, new anchor.BN(0))
      .accounts({ reputation: reputationPDA, recorderAuthority })
      .transaction();
    tx.feePayer = teeProvider.wallet.publicKey;
    tx.recentBlockhash = (await teeProvider.connection.getLatestBlockhash()).blockhash;
    tx = await teeProvider.wallet.signTransaction(tx);
    const sig = await teeProvider.sendAndConfirm(tx);
    console.log(`  ${Date.now() - start}ms TEE record tx: ${sig}`);
  });

  it("Issue attestation on TEE (the privacy-critical step)", async () => {
    const start = Date.now();
    let tx = await program.methods
      .issueAttestation(DIM_PAYMENT, new anchor.BN(1))
      .accounts({ reputation: reputationPDA })
      .transaction();
    tx.feePayer = teeProvider.wallet.publicKey;
    tx.recentBlockhash = (await teeProvider.connection.getLatestBlockhash()).blockhash;
    tx = await teeProvider.wallet.signTransaction(tx);
    const sig = await teeProvider.sendAndConfirm(tx);
    console.log(`  ${Date.now() - start}ms TEE attestation tx: ${sig}`);

    // Parse the AttestationEvent from logs
    const txInfo = await teeProvider.connection.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const logs = txInfo?.meta?.logMessages ?? [];
    const events = [...eventParser.parseLogs(logs)];
    const att = events.find((e) =>
      e.name === "attestationEvent" || e.name === "AttestationEvent"
    );
    if (!att) {
      console.log("  (no AttestationEvent parsed — but tx succeeded; logs may be filtered by TEE)");
      return;
    }
    const data = att.data as any;
    console.log(`  → score=${data.score} threshold=${data.threshold} passes=${data.passes}`);
  });

  it("Commit and undelegate (both PDAs back to base)", async () => {
    const start = Date.now();
    let tx = await program.methods
      .undelegate()
      .accounts({ payer: agent })
      .transaction();
    tx.feePayer = teeProvider.wallet.publicKey;
    tx.recentBlockhash = (await teeProvider.connection.getLatestBlockhash()).blockhash;
    tx = await teeProvider.wallet.signTransaction(tx);
    const sig = await teeProvider.sendAndConfirm(tx);
    console.log(`  ${Date.now() - start}ms TEE undelegate tx: ${sig}`);
    // Wait for the commitment to settle on base layer
    await new Promise((r) => setTimeout(r, 5000));
  });

  it("Verify state survived the round trip", async () => {
    const rep = await program.account.agentReputation.fetch(reputationPDA);
    console.log("  pay_completed after round trip:", rep.payCompleted.toString());
    if (rep.payCompleted.lten(1)) {
      throw new Error(
        `Expected pay_completed > 1 (one base + one TEE), got ${rep.payCompleted.toString()}`,
      );
    }
    console.log("  ✓ TEE-recorded event survived round trip");
  });
});
