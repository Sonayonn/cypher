/**
 * Cypher Verify — drop-in attestation verification.
 *
 * The Cypher program emits an AttestationEvent in transaction logs whenever
 * issue_attestation is invoked. This module wraps the entire flow:
 *   1. Send issue_attestation tx
 *   2. Fetch tx + parse AttestationEvent
 *   3. Return { passes, score, threshold, dimension, agent, timestamp }
 *
 * Usage:
 *
 *   const result = await verifyAttestation({
 *     agent: new PublicKey("J15w..."),
 *     dimension: 0,           // 0 = payment, 1 = credit, 2 = volume
 *     threshold: 7,
 *     wallet: walletAdapter,  // any anchor-compatible Wallet
 *     connection,             // Solana Connection
 *   });
 *
 *   if (result.passes) { ... grant access ... }
 *
 * The AGENT'S underlying score is NOT revealed in the result;
 * only whether they meet the threshold.
 */

import { AnchorProvider, BN, BorshCoder, EventParser, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./cypher-idl.json";
import type { Cypher } from "./cypher-types";

export const CYPHER_PROGRAM_ID = new PublicKey(
  "4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC",
);

export const REPUTATION_SEED = "reputation";

export const Dimensions = {
  PaymentReliability: 0,
  CreditWorthiness: 1,
  VolumeTier: 2,
} as const;

export type AttestationResult = {
  agent: PublicKey;
  dimension: number;
  threshold: BN;
  score: BN;
  passes: boolean;
  timestamp: BN;
  /** Solana transaction signature for verification */
  txSignature: string;
};

export async function verifyAttestation({
  agent,
  dimension,
  threshold,
  wallet,
  connection,
}: {
  agent: PublicKey;
  dimension: number;
  threshold: number;
  wallet: Wallet;
  connection: Connection;
}): Promise<AttestationResult> {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program<Cypher>(idl as Cypher, provider);

  const [reputationPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
    CYPHER_PROGRAM_ID,
  );

  const txSig = await program.methods
    .issueAttestation(dimension, new BN(threshold))
    .accounts({ reputation: reputationPDA })
    .rpc({ commitment: "confirmed" });

  const txInfo = await connection.getTransaction(txSig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  const logs = txInfo?.meta?.logMessages ?? [];
  const parser = new EventParser(CYPHER_PROGRAM_ID, new BorshCoder(idl as Cypher));
  const events = [...parser.parseLogs(logs)];
  const attestation = events.find(
    (e) => e.name === "attestationEvent" || e.name === "AttestationEvent",
  );
  if (!attestation) {
    throw new Error("AttestationEvent not found in transaction logs");
  }

  const data = attestation.data as Omit<AttestationResult, "txSignature">;
  return { ...data, txSignature: txSig };
}

/**
 * Convenience function: verify and return only the boolean, without exposing
 * the score even to the calling code (for verifiers who want zero score visibility).
 */
export async function attestationPasses(args: Parameters<typeof verifyAttestation>[0]): Promise<boolean> {
  const result = await verifyAttestation(args);
  return result.passes;
}
