"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsSummary } from "@/types";
import { Target } from "lucide-react";

interface WinRateGaugeProps {
  summary: AnalyticsSummary;
}

export function WinRateGauge({ summary }: WinRateGaugeProps) {
  const winRate = summary.winRate;
  const circumference = 2 * Math.PI * 40;
  const progress = (winRate / 100) * circumference;

  let gaugeColor = "#ef4444";
  if (winRate >= 60) gaugeColor = "#22c55e";
  else if (winRate >= 50) gaugeColor = "#84cc16";
  else if (winRate >= 40) gaugeColor = "#f59e0b";

  const avgRR = summary.avgLoss !== 0
    ? Math.abs(summary.avgWin / summary.avgLoss)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative h-28 w-28">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: gaugeColor }}>
              {winRate.toFixed(0)}
            </span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">percent</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-500">{summary.winCount}</p>
            <p className="text-[10px] text-muted-foreground">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-500">{summary.lossCount}</p>
            <p className="text-[10px] text-muted-foreground">Losses</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{avgRR.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Avg R:R</p>
          </div>
        </div>

        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Win Distribution</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${winRate}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${100 - winRate}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{winRate.toFixed(1)}% wins</span>
            <span>{(100 - winRate).toFixed(1)}% losses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
