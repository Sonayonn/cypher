import { AnchorProvider, BN, BorshCoder, EventParser, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";

import {
  CYPHER_PROGRAM_ID,
  REPUTATION_SEED,
  DIM_PAYMENT,
  DIM_CREDIT,
  DIM_VOLUME,
} from "./cypher-config";
import idl from "./cypher-idl.json";
import type { Cypher } from "./cypher-types";

export type AgentReputation = {
  agent: PublicKey;
  recorderAuthority: PublicKey;
  payCompleted: BN;
  payFailed: BN;
  payDisputed: BN;
  creditOnTime: BN;
  creditLate: BN;
  creditDefaulted: BN;
  volumeBuckets: BN[];
  bucketHead: number;
  bucketHeadDay: number;
  bump: number;
};

export type AttestationResult = {
  agent: PublicKey;
  dimension: number;
  threshold: BN;
  score: BN;
  passes: boolean;
  timestamp: BN;
};

export function getReputationPDA(agent: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
    CYPHER_PROGRAM_ID,
  );
  return pda;
}

export function buildProgram(connection: Connection, wallet: Wallet | null): Program<Cypher> {
  // For read-only operations a dummy wallet is fine
  const provider = new AnchorProvider(
    connection,
    wallet ?? ({ publicKey: PublicKey.default } as unknown as Wallet),
    { commitment: "confirmed" },
  );
  return new Program<Cypher>(idl as Cypher, provider);
}

export async function fetchReputation(
  connection: Connection,
  agent: PublicKey,
): Promise<AgentReputation | null> {
  try {
    const program = buildProgram(connection, null);
    const pda = getReputationPDA(agent);
    const rep = await program.account.agentReputation.fetch(pda);
    return rep as unknown as AgentReputation;
  } catch (err) {
    // Account doesn't exist or not yet initialized
    return null;
  }
}

// === Score functions (mirrors the on-chain logic — for client-side previews) ===

const SCORE_SMOOTHING = 5;
const SCORE_MAX = 10;

const TIER_1_MAX = 1_000;
const TIER_2_MAX = 10_000;
const TIER_3_MAX = 100_000;

export function calcPaymentScore(rep: AgentReputation): number {
  const completed = rep.payCompleted.toNumber();
  const failed = rep.payFailed.toNumber();
  const disputed = rep.payDisputed.toNumber();
  const raw = completed * 10 - failed * 20 - disputed * 15;
  if (raw <= 0) return 0;
  const total = completed + failed + disputed;
  return Math.min(Math.floor(completed * 10 / (total + SCORE_SMOOTHING)), SCORE_MAX);
}

export function calcCreditScore(rep: AgentReputation): number {
  const onTime = rep.creditOnTime.toNumber();
  const late = rep.creditLate.toNumber();
  const defaulted = rep.creditDefaulted.toNumber();
  const raw = onTime * 10 - late * 5 - defaulted * 30;
  if (raw <= 0) return 0;
  const total = onTime + late + defaulted;
  return Math.min(Math.floor(onTime * 10 / (total + SCORE_SMOOTHING)), SCORE_MAX);
}

export function calcVolumeTotal(rep: AgentReputation): number {
  return rep.volumeBuckets.reduce((sum, b) => sum + b.toNumber(), 0);
}

export function calcVolumeTier(rep: AgentReputation): number {
  const total = calcVolumeTotal(rep);
  if (total <= TIER_1_MAX) return 1;
  if (total <= TIER_2_MAX) return 2;
  if (total <= TIER_3_MAX) return 3;
  return 4;
}

// === Attestation: send tx + parse event ===

export async function requestAttestation(
  connection: Connection,
  wallet: Wallet,
  agent: PublicKey,
  dimension: number,
  threshold: number,
): Promise<AttestationResult> {
  const program = buildProgram(connection, wallet);
  const pda = getReputationPDA(agent);

  const tx = await program.methods
    .issueAttestation(dimension, new BN(threshold))
    .accounts({ reputation: pda })
    .rpc({ commitment: "confirmed" });

  // Fetch the tx and parse the AttestationEvent from logs
  const txInfo = await connection.getTransaction(tx, {
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
  return attestation.data as AttestationResult;
}
