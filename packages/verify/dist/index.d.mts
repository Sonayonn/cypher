import { BN, Wallet, Idl } from '@coral-xyz/anchor';
import { PublicKey, Connection } from '@solana/web3.js';

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

declare const CYPHER_PROGRAM_ID: PublicKey;
declare const REPUTATION_SEED = "reputation";
/** The three reputation dimensions Cypher tracks. */
declare const Dimensions: {
    /** Score 0–10, derived from completed vs failed/disputed payments. */
    readonly PaymentReliability: 0;
    /** Score 0–10, derived from on-time vs late/defaulted loans. */
    readonly CreditWorthiness: 1;
    /** Tier 1–4, from 30-day rolling transaction volume. */
    readonly VolumeTier: 2;
};
type Dimension = (typeof Dimensions)[keyof typeof Dimensions];
type AttestationResult = {
    agent: PublicKey;
    dimension: number;
    threshold: BN;
    score: BN;
    passes: boolean;
    timestamp: BN;
    txSignature: string;
};
type VerifyAttestationParams = {
    agent: PublicKey;
    dimension: Dimension | number;
    threshold: number;
    wallet: Wallet;
    connection: Connection;
    /** Cypher IDL — fetch from chain via Program.fetchIdl() or import from your Anchor target. */
    idl: Idl;
};
/** Derive an agent's reputation PDA address. */
declare function getReputationPDA(agent: PublicKey): PublicKey;
/**
 * Send an attestation request and parse the resulting AttestationEvent.
 *
 * @throws if AttestationEvent cannot be found in the transaction logs.
 */
declare function verifyAttestation(params: VerifyAttestationParams): Promise<AttestationResult>;
/**
 * Returns only the boolean answer, hiding the score from calling code entirely.
 * Use this when your verifier shouldn't even *see* the underlying score.
 */
declare function attestationPasses(params: VerifyAttestationParams): Promise<boolean>;

export { type AttestationResult, CYPHER_PROGRAM_ID, type Dimension, Dimensions, REPUTATION_SEED, type VerifyAttestationParams, attestationPasses, getReputationPDA, verifyAttestation };
