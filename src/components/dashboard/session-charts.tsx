"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionPerformance, HourlyPerformance, OrderTypePerformance } from "@/types";
import { formatUsd } from "@/lib/analytics";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

interface SessionChartProps {
  sessions: SessionPerformance[];
}

export function SessionChart({ sessions }: SessionChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Session Performance</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sessions} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatUsd(v)} />
            <YAxis dataKey="session" type="category" tick={{ fontSize: 11 }} width={70} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: any, name: any) => [
                name === "PnL" ? formatUsd(Number(value) || 0) : `${(Number(value) || 0).toFixed(1)}%`,
                name,
              ]}
            />
            <Bar dataKey="pnl" name="PnL" radius={[0, 4, 4, 0]}>
              {sessions.map((entry, index) => (
                <Cell key={index} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-between px-2">
          {sessions.map((s) => (
            <div key={s.session} className="text-center">
              <p className="text-[10px] text-muted-foreground">{s.session}</p>
              <p className="text-xs font-medium">{s.winRate.toFixed(0)}% WR</p>
              <p className="text-[10px] text-muted-foreground">{s.tradeCount} trades</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface HourlyChartProps {
  hourly: HourlyPerformance[];
}

export function HourlyChart({ hourly }: HourlyChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Time-of-Day Analysis (UTC)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9 }}
              tickFormatter={(h) => `${h}:00`}
            />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatUsd(v)} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(h) => `${h}:00 UTC`}
              formatter={(value: any, name: any) => [
                name === "PnL" ? formatUsd(Number(value) || 0) : String(value),
                name,
              ]}
            />
            <Bar dataKey="pnl" name="PnL" radius={[2, 2, 0, 0]}>
              {hourly.map((entry, index) => (
                <Cell key={index} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface OrderTypeChartProps {
  orderTypes: OrderTypePerformance[];
}

export function OrderTypeChart({ orderTypes }: OrderTypeChartProps) {
  const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b"];
  const labelMap: Record<string, string> = {
    limit: "Limit",
    market: "Market",
    ioc: "IOC",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Order Type Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {orderTypes.map((ot, i) => (
            <div key={ot.orderType} className="rounded-lg border border-border p-3 text-center">
              <div
                className="mx-auto mb-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[i] }}
              />
              <p className="text-xs font-medium">{labelMap[ot.orderType]}</p>
              <p className={`text-sm font-bold ${ot.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatUsd(ot.pnl)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {ot.tradeCount} trades | {ot.winRate.toFixed(0)}% WR
              </p>
            </div>
          ))}
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderTypes.map((ot) => ({
                  name: labelMap[ot.orderType],
                  value: ot.tradeCount,
                }))}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {orderTypes.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface LongShortChartProps {
  longCount: number;
  shortCount: number;
  longPnl: number;
  shortPnl: number;
}

export function LongShortChart({ longCount, shortCount, longPnl, shortPnl }: LongShortChartProps) {
  const total = longCount + shortCount;
  const longPct = total > 0 ? (longCount / total) * 100 : 50;
  const shortPct = total > 0 ? (shortCount / total) * 100 : 50;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Long/Short Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-500 font-medium">Long {longPct.toFixed(0)}%</span>
            <span className="text-red-500 font-medium">Short {shortPct.toFixed(0)}%</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${longPct}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${shortPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Long Trades</p>
            <p className="text-lg font-bold">{longCount}</p>
            <p className={`text-xs font-medium ${longPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatUsd(longPnl)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Short Trades</p>
            <p className="text-lg font-bold">{shortCount}</p>
            <p className={`text-xs font-medium ${shortPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatUsd(shortPnl)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
