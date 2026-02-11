import { Trade, Position, FundingPayment, FeeRecord, MarketType, OrderSide, OrderType } from '@/types';

const SYMBOLS = [
  { name: 'SOL/USDC', marketType: 'spot' as MarketType, basePrice: 178 },
  { name: 'SOL-PERP', marketType: 'perp' as MarketType, basePrice: 178 },
  { name: 'WETH/USDC', marketType: 'spot' as MarketType, basePrice: 3200 },
  { name: 'WETH-PERP', marketType: 'perp' as MarketType, basePrice: 3200 },
  { name: 'WBTC/USDC', marketType: 'spot' as MarketType, basePrice: 97000 },
  { name: 'WBTC-PERP', marketType: 'perp' as MarketType, basePrice: 97000 },
  { name: 'TRUMP/USDC', marketType: 'spot' as MarketType, basePrice: 18 },
];

const ORDER_TYPES: OrderType[] = ['limit', 'market', 'ioc'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randomId(rand: () => number): string {
  return Math.floor(rand() * 0xffffffffffffff).toString(16).padStart(14, '0');
}

function randomTxSig(rand: () => number): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 88; i++) {
    sig += chars[Math.floor(rand() * chars.length)];
  }
  return sig;
}

export function generateMockTrades(count: number = 200, seed: number = 42): Trade[] {
  const rand = seededRandom(seed);
  const trades: Trade[] = [];
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const symbolInfo = SYMBOLS[Math.floor(rand() * SYMBOLS.length)];
    const side: OrderSide = rand() > 0.48 ? 'long' : 'short';
    const orderType = ORDER_TYPES[Math.floor(rand() * ORDER_TYPES.length)];
    const isPerp = symbolInfo.marketType === 'perp';
    const leverage = isPerp ? Math.floor(rand() * 9) + 2 : 1;

    const priceVariation = (rand() - 0.5) * 0.15;
    const entryPrice = symbolInfo.basePrice * (1 + priceVariation);

    const pnlDirection = rand() > 0.43 ? 1 : -1;
    const pnlMagnitude = rand() * 0.08;
    const exitPriceMultiplier = side === 'long'
      ? 1 + pnlDirection * pnlMagnitude
      : 1 - pnlDirection * pnlMagnitude;
    const exitPrice = entryPrice * exitPriceMultiplier;

    const sizeUsd = 50 + rand() * 2000;
    const size = sizeUsd / entryPrice;

    const entryTime = new Date(
      threeMonthsAgo.getTime() + rand() * (now.getTime() - threeMonthsAgo.getTime())
    );
    const durationMs = (15 * 60 * 1000) + rand() * (7 * 24 * 60 * 60 * 1000);
    const exitTime = new Date(entryTime.getTime() + durationMs);

    const rawPnl = side === 'long'
      ? (exitPrice - entryPrice) * size * leverage
      : (entryPrice - exitPrice) * size * leverage;

    const fees = sizeUsd * leverage * 0.0005;
    const makerRebate = orderType === 'limit' ? fees * 0.125 : 0;
    const fundingPaid = isPerp ? sizeUsd * leverage * 0.0001 * (rand() * 3) : 0;
    const fundingReceived = isPerp ? sizeUsd * leverage * 0.00005 * (rand() * 2) : 0;

    const pnl = rawPnl - fees + makerRebate - fundingPaid + fundingReceived;
    const pnlPercent = (pnl / sizeUsd) * 100;

    const isClosed = exitTime < now;

    trades.push({
      id: randomId(rand),
      symbol: symbolInfo.name,
      marketType: symbolInfo.marketType,
      side,
      orderType,
      status: isClosed ? 'closed' : 'open',
      entryPrice,
      exitPrice: isClosed ? exitPrice : null,
      size,
      leverage,
      entryTime,
      exitTime: isClosed ? exitTime : null,
      pnl: isClosed ? pnl : 0,
      pnlPercent: isClosed ? pnlPercent : 0,
      fees,
      makerRebate,
      fundingPaid,
      fundingReceived,
      txSignature: randomTxSig(rand),
      exitTxSignature: isClosed ? randomTxSig(rand) : null,
    });
  }

  return trades.sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
}

export function generateMockPositions(seed: number = 99): Position[] {
  const rand = seededRandom(seed);
  const positions: Position[] = [];

  const openSymbols = [
    { name: 'SOL-PERP', marketType: 'perp' as MarketType, basePrice: 178, currentPrice: 181.5 },
    { name: 'SOL/USDC', marketType: 'spot' as MarketType, basePrice: 176, currentPrice: 181.5 },
    { name: 'WETH-PERP', marketType: 'perp' as MarketType, basePrice: 3150, currentPrice: 3220 },
    { name: 'WBTC/USDC', marketType: 'spot' as MarketType, basePrice: 96500, currentPrice: 97200 },
    { name: 'TRUMP/USDC', marketType: 'spot' as MarketType, basePrice: 17.5, currentPrice: 18.2 },
  ];

  for (const sym of openSymbols) {
    const side: OrderSide = rand() > 0.4 ? 'long' : 'short';
    const isPerp = sym.marketType === 'perp';
    const leverage = isPerp ? Math.floor(rand() * 5) + 2 : 1;
    const sizeUsd = 200 + rand() * 3000;
    const size = sizeUsd / sym.basePrice;
    const margin = isPerp ? sizeUsd / leverage : sizeUsd;

    const unrealizedPnl = side === 'long'
      ? (sym.currentPrice - sym.basePrice) * size * leverage
      : (sym.basePrice - sym.currentPrice) * size * leverage;
    const unrealizedPnlPercent = (unrealizedPnl / sizeUsd) * 100;

    const liquidationPrice = isPerp
      ? side === 'long'
        ? sym.basePrice * (1 - 0.9 / leverage)
        : sym.basePrice * (1 + 0.9 / leverage)
      : null;

    positions.push({
      id: randomId(rand),
      symbol: sym.name,
      marketType: sym.marketType,
      side,
      entryPrice: sym.basePrice,
      currentPrice: sym.currentPrice,
      size,
      leverage,
      margin,
      unrealizedPnl,
      unrealizedPnlPercent,
      fundingAccrued: isPerp ? (rand() - 0.3) * 20 : 0,
      openTime: new Date(Date.now() - rand() * 7 * 24 * 60 * 60 * 1000),
      liquidationPrice,
    });
  }

  return positions;
}

export function generateMockFundingPayments(count: number = 50, seed: number = 77): FundingPayment[] {
  const rand = seededRandom(seed);
  const payments: FundingPayment[] = [];
  const now = new Date();
  const perpSymbols = ['SOL-PERP', 'WETH-PERP', 'WBTC-PERP'];

  for (let i = 0; i < count; i++) {
    const symbol = perpSymbols[Math.floor(rand() * perpSymbols.length)];
    const rate = (rand() - 0.5) * 0.001;
    const positionSize = 500 + rand() * 5000;

    payments.push({
      id: randomId(rand),
      symbol,
      timestamp: new Date(now.getTime() - rand() * 30 * 24 * 60 * 60 * 1000),
      amount: rate * positionSize,
      rate,
      positionSize,
    });
  }

  return payments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateMockFeeRecords(trades: Trade[]): FeeRecord[] {
  const records: FeeRecord[] = [];

  for (const trade of trades) {
    if (trade.fees > 0) {
      records.push({
        id: `fee-${trade.id}`,
        timestamp: trade.entryTime,
        symbol: trade.symbol,
        type: 'taker',
        amount: -trade.fees,
        txSignature: trade.txSignature,
      });
    }
    if (trade.makerRebate > 0) {
      records.push({
        id: `rebate-${trade.id}`,
        timestamp: trade.entryTime,
        symbol: trade.symbol,
        type: 'maker_rebate',
        amount: trade.makerRebate,
        txSignature: trade.txSignature,
      });
    }
    if (trade.fundingPaid > 0) {
      records.push({
        id: `funding-${trade.id}`,
        timestamp: trade.entryTime,
        symbol: trade.symbol,
        type: 'funding',
        amount: -(trade.fundingPaid - trade.fundingReceived),
        txSignature: trade.txSignature,
      });
    }
  }

  return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
