"use client";

import { Trade } from "@/types";
import { generateMiniPriceData, formatUsd } from "@/lib/analytics";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface TradeReplayProps {
  trade: Trade;
}

export function TradeReplay({ trade }: TradeReplayProps) {
  const priceData = generateMiniPriceData(trade);
  const isWin = trade.pnl > 0;
  const color = isWin ? "#22c55e" : "#ef4444";
  const gradientId = `replay-grad-${trade.id.slice(0, 6)}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium">{trade.symbol}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1 py-0",
              trade.side === "long"
                ? "border-emerald-500/30 text-emerald-500"
                : "border-red-500/30 text-red-500"
            )}
          >
            {trade.side.toUpperCase()}
          </Badge>
        </div>
        <span className={cn("font-mono font-bold", isWin ? "text-emerald-500" : "text-red-500")}>
          {formatUsd(trade.pnl)}
        </span>
      </div>

      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={["auto", "auto"]} hide />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "11px",
                padding: "4px 8px",
              }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Price"]}
              labelFormatter={() => ""}
            />
            <ReferenceLine
              y={trade.entryPrice}
              stroke="#888"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            {trade.exitPrice && (
              <ReferenceLine
                y={trade.exitPrice}
                stroke={color}
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              fill={`url(#${gradientId})`}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>Entry: <span className="font-mono text-foreground">${trade.entryPrice.toFixed(2)}</span></span>
          <ArrowRight className="h-3 w-3" />
          <span>Exit: <span className="font-mono text-foreground">
            {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "—"}
          </span></span>
        </div>
        <span>
          {format(trade.entryTime, "MMM d, HH:mm")}
        </span>
      </div>
    </div>
  );
}
