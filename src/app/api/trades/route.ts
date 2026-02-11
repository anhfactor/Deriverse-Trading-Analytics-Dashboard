import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  LogType,
  SpotFillOrderReportModel,
  PerpFillOrderReportModel,
  SpotFeesReportModel,
  PerpFeesReportModel,
  PerpFundingReportModel,
} from "@deriverse/kit";

/** Always use mainnet for Deriverse trades — that's where real activity exists */
const RPC_URL = "https://api.mainnet-beta.solana.com";
const DERIVERSE_PROGRAM_ID = "DRVSpZ2YUYYKgZP8XtLhAGtT1zYSCKzeHfb4DgRnrgqD";
const MAX_SIGNATURES = 100;
const DEC = 1_000_000_000;
const DELAY_MS = 250; // delay between RPC calls to avoid 429s
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache

const cache = new Map<string, { data: any; ts: number }>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

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
        return null;
    }
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet || wallet.length < 32) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    // Check cache first
    const cached = cache.get(wallet);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const walletPubkey = new PublicKey(wallet);

    const signatures = await connection.getSignaturesForAddress(walletPubkey, {
      limit: MAX_SIGNATURES,
    });

    const trades: any[] = [];
    const feeRecords: any[] = [];
    const fundingPayments: any[] = [];
    let pendingFees = 0;
    let pendingRebates = 0;

    for (const sigInfo of signatures) {
      if (sigInfo.err) continue;

      try {
        await sleep(DELAY_MS);
        const tx = await connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (!tx || !tx.meta) continue;

        const logMessages = tx.meta.logMessages || [];
        const invokesDerivese = logMessages.some(
          (l) => l.includes(DERIVERSE_PROGRAM_ID) && l.includes("invoke")
        );
        if (!invokesDerivese) continue;

        const prefix = "Program data: ";
        const dataLogs = logMessages
          .filter((l) => l.startsWith(prefix))
          .map((l) => l.slice(prefix.length));
        if (dataLogs.length === 0) continue;

        const blockTime = tx.blockTime
          ? new Date(tx.blockTime * 1000).toISOString()
          : new Date().toISOString();

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
                side,
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
                side,
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
                timestamp: new Date(funding.time * 1000).toISOString(),
                positionSize: 0,
              });
              break;
            }
          }
        }
      } catch {
        continue;
      }
    }

    const result = {
      trades,
      feeRecords,
      fundingPayments,
      wallet,
      signaturesFound: signatures.length,
    };

    // Cache the result
    cache.set(wallet, { data: result, ts: Date.now() });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API /trades] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch trades" },
      { status: 500 }
    );
  }
}
