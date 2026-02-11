import { format, differenceInMinutes } from 'date-fns';
import {
  Trade,
  DailyPnl,
  AnalyticsSummary,
  SessionPerformance,
  HourlyPerformance,
  OrderTypePerformance,
  FilterState,
  FeeRecord,
  RiskScore,
  TradePattern,
} from '@/types';

export function filterTrades(trades: Trade[], filters: FilterState): Trade[] {
  return trades.filter((t) => {
    if (filters.symbol && t.symbol !== filters.symbol) return false;
    if (filters.side && t.side !== filters.side) return false;
    if (filters.marketType && t.marketType !== filters.marketType) return false;
    if (filters.dateRange) {
      if (t.entryTime < filters.dateRange.from) return false;
      if (t.entryTime > filters.dateRange.to) return false;
    }
    return true;
  });
}

export function computeSummary(trades: Trade[]): AnalyticsSummary {
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const wins = closedTrades.filter((t) => t.pnl > 0);
  const losses = closedTrades.filter((t) => t.pnl <= 0);

  const totalPnl = closedTrades.reduce((s, t) => s + t.pnl, 0);
  const unrealizedPnl = trades.filter((t) => t.status === 'open').reduce((s, t) => s + t.pnl, 0);
  const totalVolume = closedTrades.reduce((s, t) => s + t.size * t.entryPrice * t.leverage, 0);
  const totalFees = closedTrades.reduce((s, t) => s + t.fees, 0);
  const totalMakerRebates = closedTrades.reduce((s, t) => s + t.makerRebate, 0);

  const longTrades = closedTrades.filter((t) => t.side === 'long');
  const shortTrades = closedTrades.filter((t) => t.side === 'short');

  const durations = closedTrades
    .filter((t) => t.exitTime)
    .map((t) => differenceInMinutes(t.exitTime!, t.entryTime));
  const avgTradeDuration = durations.length > 0
    ? durations.reduce((s, d) => s + d, 0) / durations.length
    : 0;

  const grossWins = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  // Drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumPnl = 0;
  const sortedTrades = [...closedTrades].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime()
  );
  for (const t of sortedTrades) {
    cumPnl += t.pnl;
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let worstStreak = 0;
  let tempStreak = 0;
  for (const t of sortedTrades) {
    if (t.pnl > 0) {
      tempStreak = tempStreak > 0 ? tempStreak + 1 : 1;
    } else {
      tempStreak = tempStreak < 0 ? tempStreak - 1 : -1;
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    if (tempStreak < worstStreak) worstStreak = tempStreak;
  }
  currentStreak = tempStreak;

  return {
    totalPnl,
    unrealizedPnl,
    totalVolume,
    totalFees,
    totalMakerRebates,
    netFees: totalFees - totalMakerRebates,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    totalTrades: closedTrades.length,
    winCount: wins.length,
    lossCount: losses.length,
    avgTradeDuration,
    longCount: longTrades.length,
    shortCount: shortTrades.length,
    longPnl: longTrades.reduce((s, t) => s + t.pnl, 0),
    shortPnl: shortTrades.reduce((s, t) => s + t.pnl, 0),
    largestWin: wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0,
    largestLoss: losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0,
    avgWin: wins.length > 0 ? grossWins / wins.length : 0,
    avgLoss: losses.length > 0 ? -grossLosses / losses.length : 0,
    maxDrawdown,
    maxDrawdownPercent: peak > 0 ? (maxDrawdown / peak) * 100 : 0,
    profitFactor: grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0,
    expectancy:
      closedTrades.length > 0
        ? (wins.length / closedTrades.length) * (grossWins / Math.max(wins.length, 1)) -
          (losses.length / closedTrades.length) * (grossLosses / Math.max(losses.length, 1))
        : 0,
    currentStreak,
    bestStreak,
    worstStreak,
    ...computeRatios(sortedTrades),
  };
}

function computeRatios(sortedTrades: Trade[]): { sharpeRatio: number; sortinoRatio: number } {
  if (sortedTrades.length < 2) return { sharpeRatio: 0, sortinoRatio: 0 };

  // Group PnL by day
  const dailyPnls = new Map<string, number>();
  for (const t of sortedTrades) {
    const day = format(t.exitTime || t.entryTime, 'yyyy-MM-dd');
    dailyPnls.set(day, (dailyPnls.get(day) || 0) + t.pnl);
  }

  const returns = [...dailyPnls.values()];
  if (returns.length < 2) return { sharpeRatio: 0, sortinoRatio: 0 };

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;

  // Sharpe: mean / stddev (annualized with sqrt(252))
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  const stddev = Math.sqrt(variance);
  const sharpeRatio = stddev > 0 ? (mean / stddev) * Math.sqrt(252) : 0;

  // Sortino: mean / downside deviation (only negative returns)
  const downsideVariance = returns.reduce((s, r) => s + (r < 0 ? r ** 2 : 0), 0) / returns.length;
  const downsideDev = Math.sqrt(downsideVariance);
  const sortinoRatio = downsideDev > 0 ? (mean / downsideDev) * Math.sqrt(252) : 0;

  return { sharpeRatio, sortinoRatio };
}

export function computeDailyPnl(trades: Trade[]): DailyPnl[] {
  const closedTrades = trades
    .filter((t) => t.status === 'closed' && t.exitTime)
    .sort((a, b) => a.exitTime!.getTime() - b.exitTime!.getTime());

  const dailyMap = new Map<string, { pnl: number; count: number; volume: number; fees: number }>();

  for (const t of closedTrades) {
    const day = format(t.exitTime!, 'yyyy-MM-dd');
    const existing = dailyMap.get(day) || { pnl: 0, count: 0, volume: 0, fees: 0 };
    existing.pnl += t.pnl;
    existing.count += 1;
    existing.volume += t.size * t.entryPrice * t.leverage;
    existing.fees += t.fees;
    dailyMap.set(day, existing);
  }

  let cumulativePnl = 0;
  const result: DailyPnl[] = [];
  const sortedDays = [...dailyMap.keys()].sort();

  for (const day of sortedDays) {
    const data = dailyMap.get(day)!;
    cumulativePnl += data.pnl;
    result.push({
      date: day,
      pnl: data.pnl,
      cumulativePnl,
      tradeCount: data.count,
      volume: data.volume,
      fees: data.fees,
    });
  }

  return result;
}

export function computeDrawdown(dailyPnl: DailyPnl[]): { date: string; drawdown: number; drawdownPercent: number }[] {
  let peak = 0;
  return dailyPnl.map((d) => {
    if (d.cumulativePnl > peak) peak = d.cumulativePnl;
    const drawdown = peak - d.cumulativePnl;
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
    return { date: d.date, drawdown, drawdownPercent };
  });
}

function getSession(hour: number): 'Asian' | 'European' | 'US' {
  if (hour >= 0 && hour < 8) return 'Asian';
  if (hour >= 8 && hour < 16) return 'European';
  return 'US';
}

export function computeSessionPerformance(trades: Trade[]): SessionPerformance[] {
  const sessions: Record<string, { pnl: number; count: number; wins: number }> = {
    Asian: { pnl: 0, count: 0, wins: 0 },
    European: { pnl: 0, count: 0, wins: 0 },
    US: { pnl: 0, count: 0, wins: 0 },
  };

  const closedTrades = trades.filter((t) => t.status === 'closed');
  for (const t of closedTrades) {
    const session = getSession(t.entryTime.getUTCHours());
    sessions[session].pnl += t.pnl;
    sessions[session].count += 1;
    if (t.pnl > 0) sessions[session].wins += 1;
  }

  return (['Asian', 'European', 'US'] as const).map((s) => ({
    session: s,
    pnl: sessions[s].pnl,
    tradeCount: sessions[s].count,
    winRate: sessions[s].count > 0 ? (sessions[s].wins / sessions[s].count) * 100 : 0,
    avgPnl: sessions[s].count > 0 ? sessions[s].pnl / sessions[s].count : 0,
  }));
}

export function computeHourlyPerformance(trades: Trade[]): HourlyPerformance[] {
  const hourly: Record<number, { pnl: number; count: number; wins: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourly[h] = { pnl: 0, count: 0, wins: 0 };
  }

  const closedTrades = trades.filter((t) => t.status === 'closed');
  for (const t of closedTrades) {
    const hour = t.entryTime.getUTCHours();
    hourly[hour].pnl += t.pnl;
    hourly[hour].count += 1;
    if (t.pnl > 0) hourly[hour].wins += 1;
  }

  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    pnl: hourly[h].pnl,
    tradeCount: hourly[h].count,
    winRate: hourly[h].count > 0 ? (hourly[h].wins / hourly[h].count) * 100 : 0,
  }));
}

export function computeOrderTypePerformance(trades: Trade[]): OrderTypePerformance[] {
  const types: Record<string, { pnl: number; count: number; wins: number }> = {
    limit: { pnl: 0, count: 0, wins: 0 },
    market: { pnl: 0, count: 0, wins: 0 },
    ioc: { pnl: 0, count: 0, wins: 0 },
  };

  const closedTrades = trades.filter((t) => t.status === 'closed');
  for (const t of closedTrades) {
    types[t.orderType].pnl += t.pnl;
    types[t.orderType].count += 1;
    if (t.pnl > 0) types[t.orderType].wins += 1;
  }

  return (['limit', 'market', 'ioc'] as const).map((ot) => ({
    orderType: ot,
    pnl: types[ot].pnl,
    tradeCount: types[ot].count,
    winRate: types[ot].count > 0 ? (types[ot].wins / types[ot].count) * 100 : 0,
    avgPnl: types[ot].count > 0 ? types[ot].pnl / types[ot].count : 0,
  }));
}

export function computeFeeBreakdown(feeRecords: FeeRecord[]) {
  const takerFees = feeRecords
    .filter((r) => r.type === 'taker')
    .reduce((s, r) => s + Math.abs(r.amount), 0);
  const makerRebates = feeRecords
    .filter((r) => r.type === 'maker_rebate')
    .reduce((s, r) => s + r.amount, 0);
  const fundingCosts = feeRecords
    .filter((r) => r.type === 'funding')
    .reduce((s, r) => s + Math.abs(r.amount), 0);

  return [
    { name: 'Taker Fees', value: takerFees, color: '#ef4444' },
    { name: 'Maker Rebates', value: makerRebates, color: '#22c55e' },
    { name: 'Funding Costs', value: fundingCosts, color: '#f59e0b' },
  ];
}

export function computeCumulativeFees(feeRecords: FeeRecord[]): { date: string; cumulative: number }[] {
  const sorted = [...feeRecords].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const dailyMap = new Map<string, number>();

  for (const r of sorted) {
    const day = format(r.timestamp, 'yyyy-MM-dd');
    dailyMap.set(day, (dailyMap.get(day) || 0) + r.amount);
  }

  let cumulative = 0;
  const result: { date: string; cumulative: number }[] = [];
  for (const [day, amount] of [...dailyMap.entries()].sort()) {
    cumulative += amount;
    result.push({ date: day, cumulative });
  }

  return result;
}

export interface SymbolPerformance {
  symbol: string;
  pnl: number;
  tradeCount: number;
  winRate: number;
  avgTradeSize: number;
  bestTrade: number;
  worstTrade: number;
  pnlTrend: number[]; // cumulative PnL points for sparkline
}

export function computeSymbolPerformance(trades: Trade[]): SymbolPerformance[] {
  const closed = trades.filter((t) => t.status === 'closed');
  const symbolMap = new Map<string, Trade[]>();
  for (const t of closed) {
    const arr = symbolMap.get(t.symbol) || [];
    arr.push(t);
    symbolMap.set(t.symbol, arr);
  }

  const results: SymbolPerformance[] = [];
  for (const [symbol, symTrades] of symbolMap) {
    const sorted = [...symTrades].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
    const wins = sorted.filter((t) => t.pnl > 0);
    const pnl = sorted.reduce((s, t) => s + t.pnl, 0);
    const sizes = sorted.map((t) => t.size * t.entryPrice);
    const avgTradeSize = sizes.length > 0 ? sizes.reduce((s, v) => s + v, 0) / sizes.length : 0;

    // Build sparkline data (cumulative PnL trend)
    let cum = 0;
    const pnlTrend = sorted.map((t) => {
      cum += t.pnl;
      return cum;
    });

    results.push({
      symbol,
      pnl,
      tradeCount: sorted.length,
      winRate: sorted.length > 0 ? (wins.length / sorted.length) * 100 : 0,
      avgTradeSize,
      bestTrade: sorted.length > 0 ? Math.max(...sorted.map((t) => t.pnl)) : 0,
      worstTrade: sorted.length > 0 ? Math.min(...sorted.map((t) => t.pnl)) : 0,
      pnlTrend,
    });
  }

  return results.sort((a, b) => b.pnl - a.pnl);
}

export interface MonthlyReturn {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2025"
  pnl: number;
  tradeCount: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
}

export function computeMonthlyReturns(trades: Trade[]): MonthlyReturn[] {
  const closed = trades
    .filter((t) => t.status === 'closed' && t.exitTime)
    .sort((a, b) => a.exitTime!.getTime() - b.exitTime!.getTime());

  const monthMap = new Map<string, { pnl: number; count: number; wins: number; dailyPnls: Map<string, number> }>();

  for (const t of closed) {
    const month = format(t.exitTime!, 'yyyy-MM');
    const day = format(t.exitTime!, 'yyyy-MM-dd');
    const existing = monthMap.get(month) || { pnl: 0, count: 0, wins: 0, dailyPnls: new Map() };
    existing.pnl += t.pnl;
    existing.count += 1;
    if (t.pnl > 0) existing.wins += 1;
    existing.dailyPnls.set(day, (existing.dailyPnls.get(day) || 0) + t.pnl);
    monthMap.set(month, existing);
  }

  const results: MonthlyReturn[] = [];
  for (const [month, data] of [...monthMap.entries()].sort()) {
    const dailyValues = [...data.dailyPnls.values()];
    results.push({
      month,
      label: format(new Date(month + '-01'), 'MMM yyyy'),
      pnl: data.pnl,
      tradeCount: data.count,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
      bestDay: dailyValues.length > 0 ? Math.max(...dailyValues) : 0,
      worstDay: dailyValues.length > 0 ? Math.min(...dailyValues) : 0,
    });
  }

  return results;
}

export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${value >= 0 ? '' : '-'}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${value >= 0 ? '' : '-'}$${(abs / 1e3).toFixed(2)}K`;
  return `${value >= 0 ? '' : '-'}$${abs.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

export function getUniqueSymbols(trades: Trade[]): string[] {
  return [...new Set(trades.map((t) => t.symbol))].sort();
}

export function computeRiskScore(trades: Trade[], summary: AnalyticsSummary): RiskScore {
  const closedTrades = trades.filter((t) => t.status === 'closed');
  if (closedTrades.length === 0) {
    return { overall: 50, leverageScore: 50, positionSizingScore: 50, winRateScore: 50, drawdownScore: 50, consistencyScore: 50, label: 'Moderate', color: '#f59e0b' };
  }

  // Leverage score: lower avg leverage = better (100 = all 1x, 0 = all 10x)
  const avgLeverage = closedTrades.reduce((s, t) => s + t.leverage, 0) / closedTrades.length;
  const leverageScore = Math.max(0, Math.min(100, ((10 - avgLeverage) / 9) * 100));

  // Position sizing: consistent sizes = better (low coefficient of variation)
  const sizes = closedTrades.map((t) => t.size * t.entryPrice);
  const avgSize = sizes.reduce((s, v) => s + v, 0) / sizes.length;
  const stdDev = Math.sqrt(sizes.reduce((s, v) => s + (v - avgSize) ** 2, 0) / sizes.length);
  const cv = avgSize > 0 ? stdDev / avgSize : 0;
  const positionSizingScore = Math.max(0, Math.min(100, (1 - cv) * 100));

  // Win rate score: higher = better
  const winRateScore = Math.min(100, summary.winRate * 1.2);

  // Drawdown score: lower max drawdown % = better
  const drawdownScore = Math.max(0, Math.min(100, 100 - summary.maxDrawdownPercent * 2));

  // Consistency: lower daily PnL variance = better
  const dailyPnls = computeDailyPnl(closedTrades);
  const pnlValues = dailyPnls.map((d) => d.pnl);
  const avgDailyPnl = pnlValues.length > 0 ? pnlValues.reduce((s, v) => s + v, 0) / pnlValues.length : 0;
  const pnlStdDev = pnlValues.length > 0
    ? Math.sqrt(pnlValues.reduce((s, v) => s + (v - avgDailyPnl) ** 2, 0) / pnlValues.length)
    : 0;
  const pnlCv = Math.abs(avgDailyPnl) > 0 ? pnlStdDev / Math.abs(avgDailyPnl) : 5;
  const consistencyScore = Math.max(0, Math.min(100, (1 - Math.min(pnlCv / 5, 1)) * 100));

  const overall = Math.round(
    leverageScore * 0.2 +
    positionSizingScore * 0.15 +
    winRateScore * 0.25 +
    drawdownScore * 0.25 +
    consistencyScore * 0.15
  );

  let label: RiskScore['label'];
  let color: string;
  if (overall >= 80) { label = 'Excellent'; color = '#22c55e'; }
  else if (overall >= 65) { label = 'Good'; color = '#84cc16'; }
  else if (overall >= 45) { label = 'Moderate'; color = '#f59e0b'; }
  else if (overall >= 25) { label = 'High Risk'; color = '#f97316'; }
  else { label = 'Dangerous'; color = '#ef4444'; }

  return {
    overall,
    leverageScore: Math.round(leverageScore),
    positionSizingScore: Math.round(positionSizingScore),
    winRateScore: Math.round(winRateScore),
    drawdownScore: Math.round(drawdownScore),
    consistencyScore: Math.round(consistencyScore),
    label,
    color,
  };
}

export function detectPatterns(trades: Trade[]): TradePattern[] {
  const patterns: TradePattern[] = [];
  const closed = trades.filter((t) => t.status === 'closed');
  const sorted = [...closed].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());

  if (sorted.length < 3) return patterns;

  // Winning / losing streaks (3+)
  let streak = 0;
  let streakIds: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const win = sorted[i].pnl > 0;
    if (i === 0) {
      streak = win ? 1 : -1;
      streakIds = [sorted[i].id];
    } else {
      const prevWin = sorted[i - 1].pnl > 0;
      if (win === prevWin) {
        streak = win ? streak + 1 : streak - 1;
        streakIds.push(sorted[i].id);
      } else {
        if (streak >= 3) {
          patterns.push({
            type: 'winning_streak', severity: 'success',
            message: `${streak}-trade winning streak detected`,
            tradeIds: [...streakIds], detectedAt: sorted[i - 1].entryTime,
          });
        }
        if (streak <= -3) {
          patterns.push({
            type: 'losing_streak', severity: 'danger',
            message: `${Math.abs(streak)}-trade losing streak detected`,
            tradeIds: [...streakIds], detectedAt: sorted[i - 1].entryTime,
          });
        }
        streak = win ? 1 : -1;
        streakIds = [sorted[i].id];
      }
    }
  }
  // Final streak
  if (streak >= 3) {
    patterns.push({
      type: 'winning_streak', severity: 'success',
      message: `${streak}-trade winning streak (current)`,
      tradeIds: [...streakIds], detectedAt: sorted[sorted.length - 1].entryTime,
    });
  }
  if (streak <= -3) {
    patterns.push({
      type: 'losing_streak', severity: 'danger',
      message: `${Math.abs(streak)}-trade losing streak (current)`,
      tradeIds: [...streakIds], detectedAt: sorted[sorted.length - 1].entryTime,
    });
  }

  // Outsized positions (>2x average size)
  const sizes = sorted.map((t) => t.size * t.entryPrice * t.leverage);
  const avgSize = sizes.reduce((s, v) => s + v, 0) / sizes.length;
  for (let i = 0; i < sorted.length; i++) {
    if (sizes[i] > avgSize * 2.5) {
      patterns.push({
        type: 'outsized_position', severity: 'warning',
        message: `Outsized position on ${sorted[i].symbol}: ${formatUsd(sizes[i])} (avg: ${formatUsd(avgSize)})`,
        tradeIds: [sorted[i].id], detectedAt: sorted[i].entryTime,
      });
    }
  }

  // Revenge trades: loss followed within 10 min by a same-symbol trade that also loses
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].pnl < 0 && sorted[i].pnl < 0 && sorted[i].symbol === sorted[i - 1].symbol) {
      const gap = differenceInMinutes(sorted[i].entryTime, sorted[i - 1].exitTime || sorted[i - 1].entryTime);
      if (gap >= 0 && gap <= 10) {
        patterns.push({
          type: 'revenge_trade', severity: 'danger',
          message: `Possible revenge trade on ${sorted[i].symbol}: re-entered ${gap}m after a loss`,
          tradeIds: [sorted[i - 1].id, sorted[i].id], detectedAt: sorted[i].entryTime,
        });
      }
    }
  }

  // Overtrading: >10 trades in a single day
  const dayCounts = new Map<string, { count: number; ids: string[] }>();
  for (const t of sorted) {
    const day = format(t.entryTime, 'yyyy-MM-dd');
    const existing = dayCounts.get(day) || { count: 0, ids: [] };
    existing.count++;
    existing.ids.push(t.id);
    dayCounts.set(day, existing);
  }
  for (const [day, data] of dayCounts) {
    if (data.count > 10) {
      patterns.push({
        type: 'overtrading', severity: 'warning',
        message: `${data.count} trades on ${day} — possible overtrading`,
        tradeIds: data.ids, detectedAt: new Date(day),
      });
    }
  }

  // Performance trend: compare last 20 vs previous 20 trades
  if (sorted.length >= 40) {
    const recent = sorted.slice(-20);
    const previous = sorted.slice(-40, -20);
    const recentWR = recent.filter((t) => t.pnl > 0).length / recent.length;
    const prevWR = previous.filter((t) => t.pnl > 0).length / previous.length;
    if (recentWR > prevWR + 0.15) {
      patterns.push({
        type: 'improving_performance', severity: 'success',
        message: `Win rate improving: ${(recentWR * 100).toFixed(0)}% (last 20) vs ${(prevWR * 100).toFixed(0)}% (prior 20)`,
        tradeIds: recent.map((t) => t.id), detectedAt: new Date(),
      });
    }
    if (recentWR < prevWR - 0.15) {
      patterns.push({
        type: 'declining_performance', severity: 'warning',
        message: `Win rate declining: ${(recentWR * 100).toFixed(0)}% (last 20) vs ${(prevWR * 100).toFixed(0)}% (prior 20)`,
        tradeIds: recent.map((t) => t.id), detectedAt: new Date(),
      });
    }
  }

  return patterns.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
}

export function generateMiniPriceData(trade: Trade): { time: number; price: number }[] {
  const points: { time: number; price: number }[] = [];
  const entry = trade.entryPrice;
  const exit = trade.exitPrice || entry;
  const steps = 30;

  // Simulate a realistic price path between entry and exit
  let price = entry;
  const trend = (exit - entry) / steps;
  const volatility = Math.abs(exit - entry) * 0.3;

  // Simple seeded random from trade id
  let seed = 0;
  for (let i = 0; i < trade.id.length; i++) seed += trade.id.charCodeAt(i);
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646 - 0.5;
  };

  for (let i = 0; i <= steps; i++) {
    points.push({ time: i, price });
    price = price + trend + rand() * volatility;
  }
  // Ensure the last point is the exit price
  points[steps] = { time: steps, price: exit };

  return points;
}
