"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsSummary } from "@/types";
import { formatUsd, formatPercent, formatDuration } from "@/lib/analytics";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  ArrowUpDown,
  Trophy,
  Skull,
  DollarSign,
  BarChart3,
  Zap,
  Shield,
  Flame,
  Activity,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  tooltip?: string;
}

function StatCard({ title, value, subtitle, icon, trend, tooltip }: StatCardProps) {
  const content = (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p
              className={cn(
                "text-xl font-bold tracking-tight",
                trend === "up" && "text-emerald-500",
                trend === "down" && "text-red-500"
              )}
            >
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              trend === "up" && "bg-emerald-500/10 text-emerald-500",
              trend === "down" && "bg-red-500/10 text-red-500",
              trend === "neutral" && "bg-muted text-muted-foreground",
              !trend && "bg-muted text-muted-foreground"
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function StatCards({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <StatCard
        title="Total PnL"
        value={formatUsd(summary.totalPnl)}
        subtitle={`${summary.totalTrades} trades`}
        icon={summary.totalPnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        trend={summary.totalPnl >= 0 ? "up" : "down"}
        tooltip="Cumulative realized profit/loss across all closed trades"
      />
      <StatCard
        title="Win Rate"
        value={`${summary.winRate.toFixed(1)}%`}
        subtitle={`${summary.winCount}W / ${summary.lossCount}L`}
        icon={<Target className="h-4 w-4" />}
        trend={summary.winRate >= 50 ? "up" : "down"}
        tooltip="Percentage of profitable trades"
      />
      <StatCard
        title="Volume"
        value={formatUsd(summary.totalVolume)}
        subtitle={`Fees: ${formatUsd(summary.netFees)}`}
        icon={<BarChart3 className="h-4 w-4" />}
        trend="neutral"
        tooltip="Total trading volume (notional)"
      />
      <StatCard
        title="Avg Duration"
        value={formatDuration(summary.avgTradeDuration)}
        subtitle="per trade"
        icon={<Clock className="h-4 w-4" />}
        trend="neutral"
        tooltip="Average hold time for closed positions"
      />
      <StatCard
        title="Long/Short"
        value={`${summary.longCount}/${summary.shortCount}`}
        subtitle={`${((summary.longCount / Math.max(summary.totalTrades, 1)) * 100).toFixed(0)}% long`}
        icon={<ArrowUpDown className="h-4 w-4" />}
        trend="neutral"
        tooltip="Directional trade count distribution"
      />
      <StatCard
        title="Profit Factor"
        value={summary.profitFactor === Infinity ? "∞" : summary.profitFactor.toFixed(2)}
        subtitle={`Expectancy: ${formatUsd(summary.expectancy)}`}
        icon={<Zap className="h-4 w-4" />}
        trend={summary.profitFactor >= 1 ? "up" : "down"}
        tooltip="Ratio of gross profits to gross losses"
      />
      <StatCard
        title="Largest Win"
        value={formatUsd(summary.largestWin)}
        icon={<Trophy className="h-4 w-4" />}
        trend="up"
        tooltip="Largest single winning trade"
      />
      <StatCard
        title="Largest Loss"
        value={formatUsd(summary.largestLoss)}
        icon={<Skull className="h-4 w-4" />}
        trend="down"
        tooltip="Largest single losing trade"
      />
      <StatCard
        title="Avg Win"
        value={formatUsd(summary.avgWin)}
        icon={<TrendingUp className="h-4 w-4" />}
        trend="up"
        tooltip="Average profit on winning trades"
      />
      <StatCard
        title="Avg Loss"
        value={formatUsd(summary.avgLoss)}
        icon={<TrendingDown className="h-4 w-4" />}
        trend="down"
        tooltip="Average loss on losing trades"
      />
      <StatCard
        title="Max Drawdown"
        value={formatUsd(summary.maxDrawdown)}
        subtitle={formatPercent(-summary.maxDrawdownPercent)}
        icon={<Shield className="h-4 w-4" />}
        trend="down"
        tooltip="Maximum peak-to-trough decline in cumulative PnL"
      />
      <StatCard
        title="Streaks"
        value={`${summary.bestStreak}W / ${Math.abs(summary.worstStreak)}L`}
        subtitle={`Current: ${summary.currentStreak > 0 ? `${summary.currentStreak}W` : `${Math.abs(summary.currentStreak)}L`}`}
        icon={<Flame className="h-4 w-4" />}
        trend={summary.currentStreak > 0 ? "up" : summary.currentStreak < 0 ? "down" : "neutral"}
        tooltip="Best winning streak / worst losing streak"
      />
      <StatCard
        title="Sharpe Ratio"
        value={summary.sharpeRatio.toFixed(2)}
        subtitle="annualized"
        icon={<Activity className="h-4 w-4" />}
        trend={summary.sharpeRatio >= 1 ? "up" : summary.sharpeRatio <= 0 ? "down" : "neutral"}
        tooltip="Risk-adjusted return (mean daily return / volatility × √252)"
      />
      <StatCard
        title="Sortino Ratio"
        value={summary.sortinoRatio.toFixed(2)}
        subtitle="annualized"
        icon={<Gauge className="h-4 w-4" />}
        trend={summary.sortinoRatio >= 1 ? "up" : summary.sortinoRatio <= 0 ? "down" : "neutral"}
        tooltip="Downside risk-adjusted return (penalizes only negative volatility)"
      />
    </div>
  );
}
