export type MarketType = 'spot' | 'perp';
export type OrderSide = 'long' | 'short';
export type OrderType = 'limit' | 'market' | 'ioc';
export type TradeStatus = 'open' | 'closed';

export interface Trade {
  id: string;
  symbol: string;
  marketType: MarketType;
  side: OrderSide;
  orderType: OrderType;
  status: TradeStatus;
  entryPrice: number;
  exitPrice: number | null;
  size: number;
  leverage: number;
  entryTime: Date;
  exitTime: Date | null;
  pnl: number;
  pnlPercent: number;
  fees: number;
  makerRebate: number;
  fundingPaid: number;
  fundingReceived: number;
  txSignature: string;
  exitTxSignature: string | null;
}

export interface Position {
  id: string;
  symbol: string;
  marketType: MarketType;
  side: OrderSide;
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  fundingAccrued: number;
  openTime: Date;
  liquidationPrice: number | null;
}

export interface FundingPayment {
  id: string;
  symbol: string;
  timestamp: Date;
  amount: number;
  rate: number;
  positionSize: number;
}

export interface FeeRecord {
  id: string;
  timestamp: Date;
  symbol: string;
  type: 'taker' | 'maker_rebate' | 'funding';
  amount: number;
  txSignature: string;
}

export interface DailyPnl {
  date: string;
  pnl: number;
  cumulativePnl: number;
  tradeCount: number;
  volume: number;
  fees: number;
}

export interface JournalAnnotation {
  tradeId: string;
  notes: string;
  tags: string[];
  rating: number;
  screenshotUrl: string;
  updatedAt: Date;
}

export interface PortfolioSnapshot {
  totalValue: number;
  totalDeposited: number;
  totalPnl: number;
  totalFees: number;
  totalFundingNet: number;
  positions: Position[];
  allocation: { symbol: string; value: number; percentage: number }[];
}

export interface SessionPerformance {
  session: 'Asian' | 'European' | 'US';
  pnl: number;
  tradeCount: number;
  winRate: number;
  avgPnl: number;
}

export interface HourlyPerformance {
  hour: number;
  pnl: number;
  tradeCount: number;
  winRate: number;
}

export interface OrderTypePerformance {
  orderType: OrderType;
  pnl: number;
  tradeCount: number;
  winRate: number;
  avgPnl: number;
}

export interface AnalyticsSummary {
  totalPnl: number;
  unrealizedPnl: number;
  totalVolume: number;
  totalFees: number;
  totalMakerRebates: number;
  netFees: number;
  winRate: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  avgTradeDuration: number;
  longCount: number;
  shortCount: number;
  longPnl: number;
  shortPnl: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  profitFactor: number;
  expectancy: number;
  currentStreak: number;
  bestStreak: number;
  worstStreak: number;
  sharpeRatio: number;
  sortinoRatio: number;
}

export interface RiskScore {
  overall: number;
  leverageScore: number;
  positionSizingScore: number;
  winRateScore: number;
  drawdownScore: number;
  consistencyScore: number;
  label: 'Excellent' | 'Good' | 'Moderate' | 'High Risk' | 'Dangerous';
  color: string;
}

export type PatternType =
  | 'winning_streak'
  | 'losing_streak'
  | 'outsized_position'
  | 'revenge_trade'
  | 'overtrading'
  | 'improving_performance'
  | 'declining_performance';

export interface TradePattern {
  type: PatternType;
  severity: 'info' | 'warning' | 'danger' | 'success';
  message: string;
  tradeIds: string[];
  detectedAt: Date;
}

export type DateRange = {
  from: Date;
  to: Date;
};

export interface FilterState {
  symbol: string | null;
  dateRange: DateRange | null;
  side: OrderSide | null;
  marketType: MarketType | null;
}
