"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/types";
import { formatUsd } from "@/lib/analytics";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

interface PnlDistributionProps {
  trades: Trade[];
}

export const PnlDistribution = memo(function PnlDistribution({ trades }: PnlDistributionProps) {
  const closed = trades.filter((t) => t.status === "closed");
  if (closed.length < 5) return null;

  const pnls = closed.map((t) => t.pnl);
  const min = Math.min(...pnls);
  const max = Math.max(...pnls);
  const range = max - min;

  if (range === 0) return null;

  const binCount = Math.min(20, Math.max(8, Math.ceil(Math.sqrt(closed.length))));
  const binSize = range / binCount;

  const bins: { from: number; to: number; count: number; midpoint: number }[] = [];
  for (let i = 0; i < binCount; i++) {
    const from = min + i * binSize;
    const to = from + binSize;
    bins.push({ from, to, count: 0, midpoint: (from + to) / 2 });
  }

  for (const pnl of pnls) {
    let idx = Math.floor((pnl - min) / binSize);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx].count++;
  }

  const chartData = bins.map((b) => ({
    label: formatUsd(b.midpoint),
    count: b.count,
    midpoint: b.midpoint,
  }));

  const median = [...pnls].sort((a, b) => a - b)[Math.floor(pnls.length / 2)];
  const mean = pnls.reduce((s, v) => s + v, 0) / pnls.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">PnL Distribution</CardTitle>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span>Mean: <span className="font-mono font-medium">{formatUsd(mean)}</span></span>
            <span>Median: <span className="font-mono font-medium">{formatUsd(median)}</span></span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9 }}
              interval={Math.max(0, Math.floor(binCount / 6))}
            />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: any) => [value, "Trades"]}
              labelFormatter={(label) => `PnL: ${label}`}
            />
            <Bar dataKey="count" name="Trades" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.midpoint >= 0 ? "#22c55e" : "#ef4444"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
