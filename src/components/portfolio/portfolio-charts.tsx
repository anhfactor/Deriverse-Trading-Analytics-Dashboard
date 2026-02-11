"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Position, FundingPayment, FeeRecord } from "@/types";
import { formatUsd, computeFeeBreakdown, computeCumulativeFees } from "@/lib/analytics";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format } from "date-fns";

const COLORS = ["#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

interface AllocationChartProps {
  positions: Position[];
}

export function AllocationChart({ positions }: AllocationChartProps) {
  const data = positions.map((p) => ({
    name: p.symbol,
    value: Math.abs(p.size * p.currentPrice),
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={(props: any) =>
                  `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [formatUsd(Number(value) || 0), "Value"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span>{d.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">{formatUsd(d.value)}</span>
                <span className="text-muted-foreground w-10 text-right">
                  {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface MarginUtilizationProps {
  positions: Position[];
}

export function MarginUtilization({ positions }: MarginUtilizationProps) {
  const perpPositions = positions.filter((p) => p.marketType === "perp");
  const totalMargin = perpPositions.reduce((s, p) => s + p.margin, 0);
  const totalExposure = perpPositions.reduce(
    (s, p) => s + Math.abs(p.size * p.currentPrice * p.leverage),
    0
  );
  const utilization = totalExposure > 0 ? (totalMargin / totalExposure) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Margin Utilization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Margin</p>
            <p className="text-lg font-bold">{formatUsd(totalMargin)}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Exposure</p>
            <p className="text-lg font-bold">{formatUsd(totalExposure)}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Margin Usage</span>
            <span className="font-medium">{utilization.toFixed(1)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all"
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>
        {perpPositions.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span>{p.symbol}</span>
              <span className="text-muted-foreground">{p.leverage}x</span>
            </div>
            <span className="font-mono">{formatUsd(p.margin)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface FundingTrackerProps {
  fundingPayments: FundingPayment[];
}

export function FundingTracker({ fundingPayments }: FundingTrackerProps) {
  const totalReceived = fundingPayments
    .filter((f) => f.amount > 0)
    .reduce((s, f) => s + f.amount, 0);
  const totalPaid = fundingPayments
    .filter((f) => f.amount < 0)
    .reduce((s, f) => s + Math.abs(f.amount), 0);
  const netFunding = totalReceived - totalPaid;

  const dailyMap = new Map<string, number>();
  for (const f of fundingPayments) {
    const day = format(f.timestamp, "yyyy-MM-dd");
    dailyMap.set(day, (dailyMap.get(day) || 0) + f.amount);
  }

  let cumulative = 0;
  const chartData = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => {
      cumulative += amount;
      return { date, amount, cumulative };
    });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Funding Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Received</p>
            <p className="text-sm font-bold text-emerald-500">{formatUsd(totalReceived)}</p>
          </div>
          <div className="rounded-lg border border-border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Paid</p>
            <p className="text-sm font-bold text-red-500">{formatUsd(totalPaid)}</p>
          </div>
          <div className="rounded-lg border border-border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Net</p>
            <p
              className={`text-sm font-bold ${netFunding >= 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              {formatUsd(netFunding)}
            </p>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fundingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatUsd(v)} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: any) => [formatUsd(Number(value) || 0), name]}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Funding"
                stroke="#8b5cf6"
                fill="url(#fundingGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface FeeBreakdownProps {
  feeRecords: FeeRecord[];
}

export function FeeBreakdownChart({ feeRecords }: FeeBreakdownProps) {
  const breakdown = computeFeeBreakdown(feeRecords);
  const cumulativeFees = computeCumulativeFees(feeRecords);
  const totalNet = breakdown.reduce((s, b) => s + (b.name === "Maker Rebates" ? b.value : -b.value), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Fee Composition</CardTitle>
          <span className={`text-xs font-bold ${totalNet >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            Net: {formatUsd(totalNet)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
              >
                {breakdown.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [formatUsd(Number(value) || 0), "Amount"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {breakdown.map((b) => (
            <div key={b.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <span>{b.name}</span>
              </div>
              <span className="font-mono">{formatUsd(b.value)}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium mb-2">Cumulative Fees Over Time</p>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeFees}>
                <defs>
                  <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatUsd(v)} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [formatUsd(Number(value) || 0), "Cumulative"]}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Net Fees"
                  stroke="#ef4444"
                  fill="url(#feeGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
