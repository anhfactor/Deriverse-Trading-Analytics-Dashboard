"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskScore } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, Info } from "lucide-react";

interface RiskScoreCardProps {
  riskScore: RiskScore;
}

function ScoreBar({ label, value, tooltip }: { label: string; value: number; tooltip: string }) {
  let barColor = "bg-emerald-500";
  if (value < 40) barColor = "bg-red-500";
  else if (value < 60) barColor = "bg-amber-500";
  else if (value < 75) barColor = "bg-lime-500";

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-medium">{value}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[200px]">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function RiskScoreCard({ riskScore }: RiskScoreCardProps) {
  const circumference = 2 * Math.PI * 40;
  const progress = (riskScore.overall / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke={riskScore.color}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: riskScore.color }}>
                {riskScore.overall}
              </span>
              <span className="text-[9px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold" style={{ color: riskScore.color }}>
              {riskScore.label}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Composite score based on leverage, sizing, win rate, drawdown & consistency
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <ScoreBar
            label="Win Rate"
            value={riskScore.winRateScore}
            tooltip="Higher win rate = better score. Weighted 25%."
          />
          <ScoreBar
            label="Drawdown"
            value={riskScore.drawdownScore}
            tooltip="Lower max drawdown = better score. Weighted 25%."
          />
          <ScoreBar
            label="Leverage"
            value={riskScore.leverageScore}
            tooltip="Lower average leverage = better score. Weighted 20%."
          />
          <ScoreBar
            label="Position Sizing"
            value={riskScore.positionSizingScore}
            tooltip="More consistent position sizing = better score. Weighted 15%."
          />
          <ScoreBar
            label="Consistency"
            value={riskScore.consistencyScore}
            tooltip="Lower daily PnL variance = better score. Weighted 15%."
          />
        </div>
      </CardContent>
    </Card>
  );
}
