/**
 * Transaction log parser for Deriverse on-chain events.
 *
 * Fetches Solana transaction signatures for a wallet, decodes Deriverse
 * "Program data:" log messages using @deriverse/kit log models, and maps
 * fill/fee/funding events into the app's Trade / FeeRecord / FundingPayment types.
 *
 * Works on both mainnet and devnet — set NEXT_PUBLIC_RPC_URL accordingly.
 */

import { Connection, PublicKey } from "@solana/web3.js";
import {
  LogType,
  SpotFillOrderReportModel,
  PerpFillOrderReportModel,
  SpotFeesReportModel,
  PerpFeesReportModel,
  PerpFundingReportModel,
} from "@deriverse/kit";
import type { Trade, FeeRecord, FundingPayment } from "@/types";

/** RPC endpoint — defaults to mainnet where real Deriverse activity exists */
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet.solana.com";

/** Canonical Deriverse program ID from @deriverse/kit */
const DERIVERSE_PROGRAM_ID = "DRVSpZ2YUYYKgZP8XtLhAGtT1zYSCKzeHfb4DgRnrgqD";

/** Maximum number of signatures to fetch per request */
const MAX_SIGNATURES = 100;

/** Deriverse decimal precision (1e9) */
const DEC = 1_000_000_000;

interface ParsedEvents {
  trades: Trade[];
  feeRecords: FeeRecord[];
  fundingPayments: FundingPayment[];
}

/** Known Deriverse instrument names by ID */
const INSTRUMENT_NAMES: Record<number, string> = {
  0: "SOL/USDC",
  1: "BTC/USDC",
  2: "ETH/USDC",
  3: "BONK/USDC",
  4: "JTO/USDC",
  5: "TRUMP/USDC",
};

function resolveSymbol(instrId: number, isPerp: boolean): string {
  const base = INSTRUMENT_NAMES[instrId] || `INSTR-${instrId}`;
  return isPerp ? base.replace("/USDC", "-PERP") : base;
}

/**
 * Decode a single "Program data:" base64 log message from Deriverse.
 */
function decodeLogMessage(b64: string): { tag: number; model: any } | null {
  try {
    const buf = Buffer.from(b64, "base64");
    if (buf.length === 0) return null;
    const tag = buf.readUInt8(0);

    switch (tag) {
      case LogType.spotFillOrder:
        return { tag, model: SpotFillOrderReportModel.fromBuffer(buf, 0) };
      case LogType.perpFillOrder:
        return { tag, model: PerpFillOrderReportModel.fromBuffer(buf, 0) };
      case LogType.spotFees:
        return { tag, model: SpotFeesReportModel.fromBuffer(buf, 0) };
      case LogType.perpFees:
        return { tag, model: PerpFeesReportModel.fromBuffer(buf, 0) };
      case LogType.perpFunding:
        return { tag, model: PerpFundingReportModel.fromBuffer(buf, 0) };
      default:
        return null; // skip non-trade events (place, cancel, etc.)
    }
  } catch {
    return null;
  }
}

/**
 * Extract Deriverse "Program data:" entries from transaction log messages.
 */
function extractProgramDataLogs(logMessages: string[]): string[] {
  const prefix = "Program data: ";
  return logMessages
    .filter((l) => l.startsWith(prefix))
    .map((l) => l.slice(prefix.length));
}

/**
 * Fetch and parse on-chain transaction history for a wallet address.
 *
 * Strategy: fetch the wallet's recent signatures, then for each tx check
 * if it invoked the Deriverse program and decode the log messages.
 */
export async function fetchTransactionHistory(
  walletAddress: string
): Promise<ParsedEvents> {
  const trades: Trade[] = [];
  const feeRecords: FeeRecord[] = [];
  const fundingPayments: FundingPayment[] = [];

  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const walletPubkey = new PublicKey(walletAddress);

    console.log(`[Deriverse] Fetching tx history for ${walletAddress} from ${RPC_URL}`);

    // Fetch recent transaction signatures for this wallet
    const signatures = await connection.getSignaturesForAddress(walletPubkey, {
      limit: MAX_SIGNATURES,
    });

    console.log(`[Deriverse] Found ${signatures.length} signatures`);
    if (signatures.length === 0) return { trades, feeRecords, fundingPayments };

    let pendingFees = 0;
    let pendingRebates = 0;
    let processedCount = 0;

    for (const sigInfo of signatures) {
      if (sigInfo.err) continue;

      try {
        const tx = await connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta) continue;

        // Check if this tx involves the Deriverse program
        const logMessages = tx.meta.logMessages || [];
        const invokesDerivese = logMessages.some(
          (l) =>
            l.includes(DERIVERSE_PROGRAM_ID) &&
            l.includes("invoke")
        );
        if (!invokesDerivese) continue;

        // Extract and decode Deriverse log data
        const dataLogs = extractProgramDataLogs(logMessages);
        if (dataLogs.length === 0) continue;

        const blockTime = tx.blockTime
          ? new Date(tx.blockTime * 1000)
          : new Date();

        for (const b64 of dataLogs) {
          const decoded = decodeLogMessage(b64);
          if (!decoded) continue;

          const { tag, model } = decoded;

          switch (tag) {
            case LogType.spotFillOrder: {
              const fill = model as SpotFillOrderReportModel;
              const side = fill.side === 0 ? "long" : "short";
              const size = Math.abs(fill.qty) / DEC;
              const price = fill.price / DEC;
              const pnl = fill.crncy / DEC;

              trades.push({
                id: `${sigInfo.signature.slice(0, 16)}-sf-${fill.orderId}`,
                symbol: resolveSymbol(0, false),
                marketType: "spot",
                side: side as "long" | "short",
                entryPrice: price,
                exitPrice: price,
                size,
                leverage: 1,
                pnl,
                pnlPercent: price * size > 0 ? (pnl / (price * size)) * 100 : 0,
                fees: Math.abs(pendingFees),
                makerRebate: pendingRebates,
                fundingPaid: 0,
                fundingReceived: 0,
                entryTime: blockTime,
                exitTime: blockTime,
                status: "closed",
                orderType: "market",
                txSignature: sigInfo.signature,
                exitTxSignature: sigInfo.signature,
              });
              pendingFees = 0;
              pendingRebates = 0;
              processedCount++;
              break;
            }

            case LogType.perpFillOrder: {
              const fill = model as PerpFillOrderReportModel;
              const side = fill.side === 0 ? "long" : "short";
              const size = Math.abs(fill.perps) / DEC;
              const price = fill.price / DEC;
              const pnl = fill.crncy / DEC;

              trades.push({
                id: `${sigInfo.signature.slice(0, 16)}-pf-${fill.orderId}`,
                symbol: resolveSymbol(0, true),
                marketType: "perp",
                side: side as "long" | "short",
                entryPrice: price,
                exitPrice: price,
                size,
                leverage: 1,
                pnl,
                pnlPercent: price * size > 0 ? (pnl / (price * size)) * 100 : 0,
                fees: Math.abs(pendingFees),
                makerRebate: pendingRebates,
                fundingPaid: 0,
                fundingReceived: 0,
                entryTime: blockTime,
                exitTime: blockTime,
                status: "closed",
                orderType: "market",
                txSignature: sigInfo.signature,
                exitTxSignature: sigInfo.signature,
              });
              pendingFees = 0;
              pendingRebates = 0;
              processedCount++;
              break;
            }

            case LogType.spotFees: {
              const fees = model as SpotFeesReportModel;
              pendingFees = fees.fees / DEC;
              pendingRebates = fees.refPayment / DEC;

              feeRecords.push({
                id: `${sigInfo.signature.slice(0, 16)}-sfee`,
                type: fees.fees > 0 ? "taker" : "maker_rebate",
                amount: fees.fees / DEC,
                symbol: "SPOT",
                timestamp: blockTime,
                txSignature: sigInfo.signature,
              });
              break;
            }

            case LogType.perpFees: {
              const fees = model as PerpFeesReportModel;
              pendingFees = fees.fees / DEC;
              pendingRebates = fees.refPayment / DEC;

              feeRecords.push({
                id: `${sigInfo.signature.slice(0, 16)}-pfee`,
                type: fees.fees > 0 ? "taker" : "maker_rebate",
                amount: fees.fees / DEC,
                symbol: "PERP",
                timestamp: blockTime,
                txSignature: sigInfo.signature,
              });
              break;
            }

            case LogType.perpFunding: {
              const funding = model as PerpFundingReportModel;
              fundingPayments.push({
                id: `${sigInfo.signature.slice(0, 16)}-fund-${funding.instrId}`,
                symbol: resolveSymbol(funding.instrId, true),
                amount: funding.funding / DEC,
                rate: 0,
                timestamp: new Date(funding.time * 1000),
                positionSize: 0,
              });
              break;
            }
          }
        }
      } catch {
        // skip individual tx errors (rate limits, etc.)
        continue;
      }
    }

    console.log(`[Deriverse] Parsed ${processedCount} fills, ${feeRecords.length} fee records, ${fundingPayments.length} funding payments`);
  } catch (err) {
    console.error("[Deriverse] Failed to fetch tx history:", err);
  }

  return { trades, feeRecords, fundingPayments };
}
