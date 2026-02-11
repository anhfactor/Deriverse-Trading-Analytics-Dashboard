import { createSolanaRpc, address } from "@solana/kit";
import { Engine } from "@deriverse/kit";
import type { Position } from "@/types";

const DEVNET_RPC =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";
const PROGRAM_ID = process.env.NEXT_PUBLIC_DERIVERSE_PROGRAM_ID || "";
const VERSION = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION || "0");

export interface DeriverseClientData {
  positions: Position[];
  tokenBalances: Map<number, number>;
  spotTrades: number;
  perpTrades: number;
  clientId: number;
}

let engineInstance: Engine | null = null;
let currentWallet: string | null = null;

export async function getEngine(): Promise<Engine> {
  if (engineInstance) return engineInstance;

  if (!PROGRAM_ID) {
    console.warn(
      "[Deriverse] NEXT_PUBLIC_DERIVERSE_PROGRAM_ID is not set. Running in demo mode only."
    );
    throw new Error("PROGRAM_ID_NOT_SET");
  }

  const rpc = createSolanaRpc(DEVNET_RPC);
  const engine = new Engine(rpc as any, {
    programId: address(PROGRAM_ID) as any,
    version: VERSION,
  });

  await engine.initialize();
  engineInstance = engine;
  return engine;
}

export function isProgramConfigured(): boolean {
  return !!PROGRAM_ID;
}

export async function connectWallet(
  walletAddress: string
): Promise<boolean> {
  if (!isProgramConfigured()) return false;

  try {
    const engine = await getEngine();
    await engine.setSigner(address(walletAddress) as any);

    if (engine.originalClientId) {
      currentWallet = walletAddress;
      return true;
    }
    return false;
  } catch (err) {
    console.error("[Deriverse] Failed to connect wallet:", err);
    return false;
  }
}

export async function fetchClientData(): Promise<DeriverseClientData | null> {
  if (!isProgramConfigured()) return null;

  try {
    const engine = await getEngine();
    if (!currentWallet || !engine.originalClientId) return null;

    const clientData = await engine.getClientData();
    const positions: Position[] = [];

    // Collect all instrument IDs from spot + perp
    const instrIds = new Set<number>();
    for (const [instrId] of clientData.spot) instrIds.add(instrId);
    for (const [instrId] of clientData.perp) instrIds.add(instrId);

    // Fetch instrument market data
    for (const instrId of instrIds) {
      try {
        await engine.updateInstrData({ instrId } as any);
      } catch {
        // instrument data may be unavailable
      }
    }

    // Resolve instrument symbol from header mint addresses
    const resolveSymbol = (instrId: number): string => {
      const instr = engine.instruments.get(instrId);
      if (!instr) return `INSTR-${instrId}`;
      const assetMint = String(instr.header.assetMint).slice(0, 4);
      const crncyMint = String(instr.header.crncyMint).slice(0, 4);
      return `${assetMint}/${crncyMint}`;
    };

    // Map perp positions — these have margin account data
    for (const [instrId, perpData] of clientData.perp) {
      const instr = engine.instruments.get(instrId);
      if (!instr) continue;

      try {
        const perpInfo = await engine.getClientPerpOrdersInfo({
          clientId: perpData.clientId,
          instrId,
        });

        const currentPrice = instr.header.perpLastPx || instr.header.lastPx;
        const perps = perpInfo.perps; // position size in base
        if (perps === 0) continue;

        const side = perps > 0 ? ("long" as const) : ("short" as const);
        const absSize = Math.abs(perps);
        const cost = perpInfo.cost;
        const entryPrice = absSize > 0 ? Math.abs(cost / perps) : currentPrice;
        const funds = perpInfo.funds;
        const leverage = perpInfo.mask & 0xff || 1;
        const unrealizedPnl = (currentPrice - entryPrice) * perps;
        const margin = funds;
        const unrealizedPnlPercent =
          margin > 0 ? (unrealizedPnl / margin) * 100 : 0;
        const fundingAccrued = perpInfo.fundingFunds;

        positions.push({
          id: `perp-${instrId}-${currentWallet}`,
          symbol: resolveSymbol(instrId) + "-PERP",
          marketType: "perp",
          side,
          entryPrice,
          currentPrice,
          size: absSize,
          leverage,
          margin,
          unrealizedPnl,
          unrealizedPnlPercent,
          fundingAccrued,
          openTime: new Date(),
          liquidationPrice: null,
        });
      } catch {
        // skip instruments with errors
      }
    }

    // Map spot positions — check for open orders
    for (const [instrId, spotData] of clientData.spot) {
      const instr = engine.instruments.get(instrId);
      if (!instr) continue;

      try {
        const spotInfo = await engine.getClientSpotOrdersInfo({
          clientId: spotData.clientId,
          instrId,
        });

        const currentPrice = instr.header.lastPx;
        // Spot doesn't carry a "position" in the perp sense,
        // but we can show temp tokens as exposure
        const assetTokens = spotInfo.tempAssetTokens + spotInfo.inOrdersAssetTokens;
        if (assetTokens === 0) continue;

        positions.push({
          id: `spot-${instrId}-${currentWallet}`,
          symbol: resolveSymbol(instrId),
          marketType: "spot",
          side: "long",
          entryPrice: currentPrice,
          currentPrice,
          size: assetTokens,
          leverage: 1,
          margin: assetTokens * currentPrice,
          unrealizedPnl: 0,
          unrealizedPnlPercent: 0,
          fundingAccrued: 0,
          openTime: new Date(),
          liquidationPrice: null,
        });
      } catch {
        // skip
      }
    }

    // Collect token balances
    const tokenBalances = new Map<number, number>();
    for (const [tokenId, tokenData] of clientData.tokens) {
      tokenBalances.set(tokenId, tokenData.amount);
    }

    return {
      positions,
      tokenBalances,
      spotTrades: clientData.spotTrades,
      perpTrades: clientData.perpTrades,
      clientId: clientData.clientId,
    };
  } catch (err) {
    console.error("[Deriverse] Failed to fetch client data:", err);
    return null;
  }
}

export function disconnectEngine() {
  currentWallet = null;
}

export function isConnected(): boolean {
  return currentWallet !== null && engineInstance !== null;
}

export function getWalletAddress(): string | null {
  return currentWallet;
}
