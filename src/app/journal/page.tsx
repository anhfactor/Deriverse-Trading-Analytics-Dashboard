"use client";

import { useEffect, useMemo } from "react";
import { useTradingStore } from "@/store/use-trading-store";
import { filterTrades, computeSummary, formatUsd } from "@/lib/analytics";
import { TradeTable } from "@/components/journal/trade-table";
import { Card, CardContent } from "@/components/ui/card";
import { Filters } from "@/components/dashboard/filters";
import { JournalSkeleton } from "@/components/layout/skeleton-loaders";
import { Target, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JournalPage() {
  const { trades, filters, isLoading, loadMockData } = useTradingStore();

  useEffect(() => {
    if (trades.length === 0) loadMockData();
  }, [trades.length, loadMockData]);

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters]);
  const summary = useMemo(() => computeSummary(filteredTrades), [filteredTrades]);

  if (isLoading) {
    return <JournalSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
          <p className="text-sm text-muted-foreground">
            Review, annotate, and learn from your trades
          </p>
        </div>
        <Filters />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total Trades</p>
              <p className="text-lg font-bold">{summary.totalTrades}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              summary.totalPnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
            )}>
              {summary.totalPnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total PnL</p>
              <p className={cn(
                "text-lg font-bold",
                summary.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"
              )}>
                {formatUsd(summary.totalPnl)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              summary.winRate >= 50 ? "bg-emerald-500/10" : "bg-red-500/10"
            )}>
              <Target className={cn(
                "h-4 w-4",
                summary.winRate >= 50 ? "text-emerald-500" : "text-red-500"
              )} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Win Rate</p>
              <p className="text-lg font-bold">{summary.winRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Profit Factor</p>
              <p className="text-lg font-bold">
                {summary.profitFactor === Infinity ? "∞" : summary.profitFactor.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <TradeTable trades={filteredTrades} />
    </div>
  );
}
