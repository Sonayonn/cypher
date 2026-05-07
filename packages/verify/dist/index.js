"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CYPHER_PROGRAM_ID: () => CYPHER_PROGRAM_ID,
  Dimensions: () => Dimensions,
  REPUTATION_SEED: () => REPUTATION_SEED,
  attestationPasses: () => attestationPasses,
  getReputationPDA: () => getReputationPDA,
  verifyAttestation: () => verifyAttestation
});
module.exports = __toCommonJS(index_exports);
var import_anchor = require("@coral-xyz/anchor");
var import_web3 = require("@solana/web3.js");
var CYPHER_PROGRAM_ID = new import_web3.PublicKey(
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
  const [pda] = import_web3.PublicKey.findProgramAddressSync(
    [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
    CYPHER_PROGRAM_ID
  );
  return pda;
}
async function verifyAttestation(params) {
  const { agent, dimension, threshold, wallet, connection, idl } = params;
  const provider = new import_anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new import_anchor.Program(idl, provider);
  const reputationPDA = getReputationPDA(agent);
  const txSignature = await program.methods.issueAttestation(dimension, new import_anchor.BN(threshold)).accounts({ reputation: reputationPDA }).rpc({ commitment: "confirmed" });
  const txInfo = await connection.getTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0
  });
  const logs = txInfo?.meta?.logMessages ?? [];
  const parser = new import_anchor.EventParser(CYPHER_PROGRAM_ID, new import_anchor.BorshCoder(idl));
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CYPHER_PROGRAM_ID,
  Dimensions,
  REPUTATION_SEED,
  attestationPasses,
  getReputationPDA,
  verifyAttestation
});
