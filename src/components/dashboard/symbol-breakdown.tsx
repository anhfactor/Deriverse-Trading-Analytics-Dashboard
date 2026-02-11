"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SymbolPerformance } from "@/lib/analytics";
import { formatUsd } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface SymbolBreakdownProps {
  symbols: SymbolPerformance[];
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={positive ? "#22c55e" : "#ef4444"}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const SymbolBreakdown = memo(function SymbolBreakdown({ symbols }: SymbolBreakdownProps) {
  if (symbols.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Symbol Performance Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Symbol</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Trades</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Win Rate</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">PnL</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Avg Size</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Best</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Worst</th>
                <th className="text-right py-2 pl-3 font-medium text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((s) => (
                <tr key={s.symbol} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium">{s.symbol}</span>
                  </td>
                  <td className="text-right py-2.5 px-3 text-muted-foreground">{s.tradeCount}</td>
                  <td className="text-right py-2.5 px-3">
                    <span className={cn(
                      "font-medium",
                      s.winRate >= 50 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {s.winRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <span className={cn(
                      "font-mono font-medium",
                      s.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {formatUsd(s.pnl)}
                    </span>
                  </td>
                  <td className="text-right py-2.5 px-3 text-muted-foreground font-mono">
                    {formatUsd(s.avgTradeSize)}
                  </td>
                  <td className="text-right py-2.5 px-3 text-emerald-500 font-mono">
                    {formatUsd(s.bestTrade)}
                  </td>
                  <td className="text-right py-2.5 px-3 text-red-500 font-mono">
                    {formatUsd(s.worstTrade)}
                  </td>
                  <td className="text-right py-2.5 pl-3">
                    {s.pnlTrend.length > 1 && (
                      <MiniSparkline data={s.pnlTrend} positive={s.pnl >= 0} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
