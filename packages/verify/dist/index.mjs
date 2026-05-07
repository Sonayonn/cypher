// src/index.ts
import { AnchorProvider, BN, BorshCoder, EventParser, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
var CYPHER_PROGRAM_ID = new PublicKey(
  "4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC"
);
var REPUTATION_SEED = "reputation";
var Dimensions = {
  /** Score 0–10, derived from completed vs failed/disputed payments. */
  PaymentReliability: 0,
  /** Score 0–10, derived from on-time vs late/defaulted loans. */
  CreditWorthiness: 1,
  /** Tier 1–4, from 30-day rolling transaction volume. */
  VolumeTier: 2
};
function getReputationPDA(agent) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
    CYPHER_PROGRAM_ID
  );
  return pda;
}
async function verifyAttestation(params) {
  const { agent, dimension, threshold, wallet, connection, idl } = params;
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program(idl, provider);
  const reputationPDA = getReputationPDA(agent);
  const txSignature = await program.methods.issueAttestation(dimension, new BN(threshold)).accounts({ reputation: reputationPDA }).rpc({ commitment: "confirmed" });
  const txInfo = await connection.getTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0
  });
  const logs = txInfo?.meta?.logMessages ?? [];
  const parser = new EventParser(CYPHER_PROGRAM_ID, new BorshCoder(idl));
  const events = [...parser.parseLogs(logs)];
  const attestation = events.find(
    (e) => e.name === "attestationEvent" || e.name === "AttestationEvent"
  );
  if (!attestation) {
    throw new Error("AttestationEvent not found in transaction logs");
  }
  const data = attestation.data;
  return { ...data, txSignature };
}
async function attestationPasses(params) {
  const result = await verifyAttestation(params);
  return result.passes;
}
export {
  CYPHER_PROGRAM_ID,
  Dimensions,
  REPUTATION_SEED,
  attestationPasses,
  getReputationPDA,
  verifyAttestation
};
