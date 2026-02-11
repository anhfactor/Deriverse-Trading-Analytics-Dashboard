"use client";

import { useEffect, useMemo } from "react";
import { useTradingStore } from "@/store/use-trading-store";
import { computeSummary, filterTrades, formatUsd } from "@/lib/analytics";
import { PositionsTable } from "@/components/portfolio/positions-table";
import {
  AllocationChart,
  MarginUtilization,
  FundingTracker,
  FeeBreakdownChart,
} from "@/components/portfolio/portfolio-charts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PortfolioSkeleton } from "@/components/layout/skeleton-loaders";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  Wallet,
} from "lucide-react";

export default function PortfolioPage() {
  const { trades, positions, fundingPayments, feeRecords, filters, isLoading, loadMockData } =
    useTradingStore();

  useEffect(() => {
    if (trades.length === 0) loadMockData();
  }, [trades.length, loadMockData]);

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters]);
  const summary = useMemo(() => computeSummary(filteredTrades), [filteredTrades]);

  const totalPositionValue = positions.reduce(
    (s, p) => s + Math.abs(p.size * p.currentPrice),
    0
  );
  const totalUnrealized = positions.reduce((s, p) => s + p.unrealizedPnl, 0);
  const totalMargin = positions
    .filter((p) => p.marketType === "perp")
    .reduce((s, p) => s + p.margin, 0);

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Position management, margin utilization, and fee analysis
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Portfolio Value</p>
                <p className="text-xl font-bold">{formatUsd(totalPositionValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  totalUnrealized >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                )}
              >
                {totalUnrealized >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unrealized PnL</p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    totalUnrealized >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {formatUsd(totalUnrealized)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Margin</p>
                <p className="text-xl font-bold">{formatUsd(totalMargin)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                <DollarSign className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Realized PnL</p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    summary.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {formatUsd(summary.totalPnl)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PositionsTable positions={positions} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AllocationChart positions={positions} />
        <MarginUtilization positions={positions} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FundingTracker fundingPayments={fundingPayments} />
        <FeeBreakdownChart feeRecords={feeRecords} />
      </div>
    </div>
  );
}
