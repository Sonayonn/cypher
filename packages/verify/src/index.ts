/**
 * Cypher Verify — privacy-first attestation verification for Solana agents.
 *
 * The Cypher program emits an AttestationEvent in transaction logs whenever
 * issue_attestation is invoked. This module wraps the entire flow:
 *   1. Send issue_attestation tx
 *   2. Fetch tx + parse AttestationEvent
 *   3. Return { passes, score, threshold, dimension, agent, timestamp }
 *
 * The agent's underlying score is NOT revealed in the verifier's application
 * logic — only whether the threshold is met.
 *
 * @example
 * ```ts
 * import { verifyAttestation, Dimensions } from "@cypher-protocol/verify";
 *
 * const result = await verifyAttestation({
 *   agent: new PublicKey("J15w..."),
 *   dimension: Dimensions.PaymentReliability,
 *   threshold: 7,
 *   wallet,
 *   connection,
 *   idl,
 * });
 *
 * if (result.passes) grantAccess();
 * ```
 */

import { AnchorProvider, BN, BorshCoder, EventParser, Idl, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

export const CYPHER_PROGRAM_ID = new PublicKey(
  "4ofnnZnnjkejk8Sk5ggjtAzAC9YSeVGTLuX1g7jPrtJC",
);

export const REPUTATION_SEED = "reputation";

/** The three reputation dimensions Cypher tracks. */
export const Dimensions = {
  /** Score 0–10, derived from completed vs failed/disputed payments. */
  PaymentReliability: 0,
  /** Score 0–10, derived from on-time vs late/defaulted loans. */
  CreditWorthiness: 1,
  /** Tier 1–4, from 30-day rolling transaction volume. */
  VolumeTier: 2,
} as const;

export type Dimension = (typeof Dimensions)[keyof typeof Dimensions];

export type AttestationResult = {
  agent: PublicKey;
  dimension: number;
  threshold: BN;
  score: BN;
  passes: boolean;
  timestamp: BN;
  txSignature: string;
};

export type VerifyAttestationParams = {
  agent: PublicKey;
  dimension: Dimension | number;
  threshold: number;
  wallet: Wallet;
  connection: Connection;
  /** Cypher IDL — fetch from chain via Program.fetchIdl() or import from your Anchor target. */
  idl: Idl;
};

/** Derive an agent's reputation PDA address. */
export function getReputationPDA(agent: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
    CYPHER_PROGRAM_ID,
  );
  return pda;
}

/**
 * Send an attestation request and parse the resulting AttestationEvent.
 *
 * @throws if AttestationEvent cannot be found in the transaction logs.
 */
export async function verifyAttestation(
  params: VerifyAttestationParams,
): Promise<AttestationResult> {
  const { agent, dimension, threshold, wallet, connection, idl } = params;

  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program(idl, provider);

  const reputationPDA = getReputationPDA(agent);

  const txSignature = await program.methods
    .issueAttestation(dimension as number, new BN(threshold))
    .accounts({ reputation: reputationPDA })
    .rpc({ commitment: "confirmed" });

  const txInfo = await connection.getTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  const logs = txInfo?.meta?.logMessages ?? [];
  const parser = new EventParser(CYPHER_PROGRAM_ID, new BorshCoder(idl));
  const events = [...parser.parseLogs(logs)];
  const attestation = events.find(
    (e) => e.name === "attestationEvent" || e.name === "AttestationEvent",
  );
  if (!attestation) {
    throw new Error("AttestationEvent not found in transaction logs");
  }

  const data = attestation.data as Omit<AttestationResult, "txSignature">;
  return { ...data, txSignature };
}

/**
 * Returns only the boolean answer, hiding the score from calling code entirely.
 * Use this when your verifier shouldn't even *see* the underlying score.
 */
export async function attestationPasses(
  params: VerifyAttestationParams,
): Promise<boolean> {
  const result = await verifyAttestation(params);
  return result.passes;
}
