"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyPnl } from "@/types";
import { computeDrawdown, formatUsd } from "@/lib/analytics";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PnlChartProps {
  dailyPnl: DailyPnl[];
}

export const PnlChart = memo(function PnlChart({ dailyPnl }: PnlChartProps) {
  const drawdownData = computeDrawdown(dailyPnl);

  const combinedData = dailyPnl.map((d, i) => ({
    ...d,
    drawdown: drawdownData[i]?.drawdown || 0,
    drawdownPercent: drawdownData[i]?.drawdownPercent || 0,
  }));

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Performance & Drawdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="equity" className="space-y-4">
          <TabsList className="h-8">
            <TabsTrigger value="equity" className="text-xs">
              Equity Curve
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs">
              Daily PnL
            </TabsTrigger>
            <TabsTrigger value="drawdown" className="text-xs">
              Drawdown
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equity" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedData}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  yAxisId="pnl"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => formatUsd(v)}
                />
                <YAxis
                  yAxisId="dd"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => formatUsd(v)}
                  reversed
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: any) => [
                    formatUsd(Number(value) || 0),
                    name,
                  ]}
                />
                <Area
                  yAxisId="pnl"
                  type="monotone"
                  dataKey="cumulativePnl"
                  name="Cumulative PnL"
                  stroke="#22c55e"
                  fill="url(#pnlGradient)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="dd"
                  type="monotone"
                  dataKey="drawdown"
                  name="Drawdown"
                  stroke="#ef4444"
                  fill="url(#ddGradient)"
                  strokeWidth={1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="daily" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => formatUsd(v)}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: any) => [
                    formatUsd(Number(value) || 0),
                    name,
                  ]}
                />
                <Bar
                  dataKey="pnl"
                  name="Daily PnL"
                  fill="#22c55e"
                  radius={[2, 2, 0, 0]}
                >
                  {combinedData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="drawdown" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedData}>
                <defs>
                  <linearGradient id="ddGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  reversed
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`${(Number(value) || 0).toFixed(2)}%`, "Drawdown"]}
                />
                <Area
                  type="monotone"
                  dataKey="drawdownPercent"
                  name="Drawdown %"
                  stroke="#ef4444"
                  fill="url(#ddGradient2)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
