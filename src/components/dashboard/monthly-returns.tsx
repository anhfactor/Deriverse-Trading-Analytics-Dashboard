"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyReturn } from "@/lib/analytics";
import { formatUsd } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface MonthlyReturnsProps {
  months: MonthlyReturn[];
}

export const MonthlyReturnsTable = memo(function MonthlyReturnsTable({ months }: MonthlyReturnsProps) {
  if (months.length === 0) return null;

  const totalPnl = months.reduce((s, m) => s + m.pnl, 0);
  const totalTrades = months.reduce((s, m) => s + m.tradeCount, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Monthly Returns</CardTitle>
          <span className={cn(
            "text-xs font-bold",
            totalPnl >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            Total: {formatUsd(totalPnl)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Month</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">PnL</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Trades</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Win Rate</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Best Day</th>
                <th className="text-right py-2 pl-3 font-medium text-muted-foreground">Worst Day</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-3 font-medium">{m.label}</td>
                  <td className="text-right py-2.5 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            m.pnl >= 0 ? "bg-emerald-500" : "bg-red-500"
                          )}
                          style={{
                            width: `${Math.min(Math.abs(m.pnl) / (Math.max(...months.map((x) => Math.abs(x.pnl))) || 1) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className={cn(
                        "font-mono font-medium min-w-[70px] text-right",
                        m.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {formatUsd(m.pnl)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-2.5 px-3 text-muted-foreground">{m.tradeCount}</td>
                  <td className="text-right py-2.5 px-3">
                    <span className={cn(
                      "font-medium",
                      m.winRate >= 50 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {m.winRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="text-right py-2.5 px-3 text-emerald-500 font-mono">
                    {formatUsd(m.bestDay)}
                  </td>
                  <td className="text-right py-2.5 pl-3 text-red-500 font-mono">
                    {formatUsd(m.worstDay)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="py-2.5 pr-3 font-bold">Total</td>
                <td className="text-right py-2.5 px-3">
                  <span className={cn(
                    "font-mono font-bold",
                    totalPnl >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                    {formatUsd(totalPnl)}
                  </span>
                </td>
                <td className="text-right py-2.5 px-3 font-bold text-muted-foreground">{totalTrades}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
