"use client";

import { useEffect, useMemo } from "react";
import { useTradingStore } from "@/store/use-trading-store";
import {
  filterTrades,
  computeSummary,
  computeDailyPnl,
  computeSessionPerformance,
  computeHourlyPerformance,
  computeOrderTypePerformance,
  computeRiskScore,
  detectPatterns,
  computeSymbolPerformance,
  computeMonthlyReturns,
} from "@/lib/analytics";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Filters } from "@/components/dashboard/filters";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import { DailyHeatmap } from "@/components/dashboard/daily-heatmap";
import {
  SessionChart,
  HourlyChart,
  OrderTypeChart,
  LongShortChart,
} from "@/components/dashboard/session-charts";
import { RiskScoreCard } from "@/components/dashboard/risk-score";
import { PatternsAlert } from "@/components/dashboard/patterns-alert";
import { WinRateGauge } from "@/components/dashboard/win-rate-gauge";
import { Activity } from "lucide-react";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { DashboardSkeleton } from "@/components/layout/skeleton-loaders";
import { SymbolBreakdown } from "@/components/dashboard/symbol-breakdown";
import { MonthlyReturnsTable } from "@/components/dashboard/monthly-returns";
import { PnlDistribution } from "@/components/dashboard/pnl-distribution";

export default function DashboardPage() {
  const { trades, filters, isLoading, isDemoMode, connectedWallet, loadMockData, loadLiveData, setDemoMode } = useTradingStore();

  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters]);
  const summary = useMemo(() => computeSummary(filteredTrades), [filteredTrades]);
  const dailyPnl = useMemo(() => computeDailyPnl(filteredTrades), [filteredTrades]);
  const sessions = useMemo(() => computeSessionPerformance(filteredTrades), [filteredTrades]);
  const hourly = useMemo(() => computeHourlyPerformance(filteredTrades), [filteredTrades]);
  const orderTypes = useMemo(() => computeOrderTypePerformance(filteredTrades), [filteredTrades]);
  const riskScore = useMemo(() => computeRiskScore(filteredTrades, summary), [filteredTrades, summary]);
  const patterns = useMemo(() => detectPatterns(filteredTrades), [filteredTrades]);
  const symbolPerf = useMemo(() => computeSymbolPerformance(filteredTrades), [filteredTrades]);
  const monthlyReturns = useMemo(() => computeMonthlyReturns(filteredTrades), [filteredTrades]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {!isDemoMode && (
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Fetching on-chain Deriverse trades from Solana mainnet...
            </div>
            <p className="mt-1 text-xs text-muted-foreground/60">
              This may take 30–60 seconds on first load due to RPC rate limits.
            </p>
          </div>
        )}
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isDemoMode && trades.length === 0) {
    const exampleTrader = "FzzkRifeTpLAcgS52SnHeFbHmeYqscyPaiNADBrckEJu";
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="rounded-full bg-muted p-4">
          <Activity className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">No Deriverse Trades Found</h2>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Wallet <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{connectedWallet?.slice(0, 8)}...{connectedWallet?.slice(-4)}</code> has no Deriverse trading activity on Solana mainnet.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => loadLiveData(exampleTrader)}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Try Example Trader
          </button>
          <button
            onClick={() => { setDemoMode(true); loadMockData(); }}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Switch to Demo
          </button>
        </div>
        <p className="text-xs text-muted-foreground/50 mt-1">
          Example: <code className="text-[10px]">{exampleTrader.slice(0, 16)}...{exampleTrader.slice(-4)}</code> — a real Deriverse trader on mainnet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Performance overview across all markets
          </p>
        </div>
        <Filters />
      </div>

      <StatCards summary={summary} />

      <ErrorBoundary fallbackMessage="Failed to render PnL chart">
        <PnlChart dailyPnl={dailyPnl} />
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Failed to render heatmap">
        <DailyHeatmap dailyPnl={dailyPnl} />
      </ErrorBoundary>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <WinRateGauge summary={summary} />
        <LongShortChart
          longCount={summary.longCount}
          shortCount={summary.shortCount}
          longPnl={summary.longPnl}
          shortPnl={summary.shortPnl}
        />
        <RiskScoreCard riskScore={riskScore} />
        <PatternsAlert patterns={patterns} />
      </div>

      <ErrorBoundary fallbackMessage="Failed to render session charts">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <SessionChart sessions={sessions} />
          <OrderTypeChart orderTypes={orderTypes} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Failed to render hourly chart">
        <HourlyChart hourly={hourly} />
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Failed to render symbol breakdown">
        <SymbolBreakdown symbols={symbolPerf} />
      </ErrorBoundary>

      <div className="grid gap-4 lg:grid-cols-2">
        <ErrorBoundary fallbackMessage="Failed to render monthly returns">
          <MonthlyReturnsTable months={monthlyReturns} />
        </ErrorBoundary>
        <ErrorBoundary fallbackMessage="Failed to render PnL distribution">
          <PnlDistribution trades={filteredTrades} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
