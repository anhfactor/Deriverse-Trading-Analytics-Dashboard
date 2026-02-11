"use client";

import { Position } from "@/types";
import { formatUsd, formatPercent } from "@/lib/analytics";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PositionsTableProps {
  positions: Position[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const totalUnrealized = positions.reduce((s, p) => s + p.unrealizedPnl, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
          <span
            className={cn(
              "text-sm font-bold",
              totalUnrealized >= 0 ? "text-emerald-500" : "text-red-500"
            )}
          >
            Unrealized: {formatUsd(totalUnrealized)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Symbol</TableHead>
              <TableHead className="text-xs">Side</TableHead>
              <TableHead className="text-xs text-right">Entry</TableHead>
              <TableHead className="text-xs text-right">Current</TableHead>
              <TableHead className="text-xs text-right">Size</TableHead>
              <TableHead className="text-xs text-right">Margin</TableHead>
              <TableHead className="text-xs text-right">Unrealized PnL</TableHead>
              <TableHead className="text-xs text-right">Liq. Price</TableHead>
              <TableHead className="text-xs text-right">Funding</TableHead>
              <TableHead className="text-xs">Opened</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((pos) => (
              <TableRow key={pos.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{pos.symbol}</span>
                    {pos.marketType === "perp" && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {pos.leverage}x
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      pos.side === "long"
                        ? "border-emerald-500/30 text-emerald-500"
                        : "border-red-500/30 text-red-500"
                    )}
                  >
                    {pos.side.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-right font-mono">
                  ${pos.entryPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-xs text-right font-mono">
                  ${pos.currentPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-xs text-right font-mono">
                  {formatUsd(pos.size * pos.entryPrice)}
                </TableCell>
                <TableCell className="text-xs text-right font-mono">
                  {formatUsd(pos.margin)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-xs text-right font-mono font-medium",
                    pos.unrealizedPnl >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  <div>
                    <div>{formatUsd(pos.unrealizedPnl)}</div>
                    <div className="text-[10px]">{formatPercent(pos.unrealizedPnlPercent)}</div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-right font-mono text-muted-foreground">
                  {pos.liquidationPrice ? `$${pos.liquidationPrice.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-xs text-right font-mono",
                    pos.fundingAccrued >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {formatUsd(pos.fundingAccrued)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(pos.openTime, "MM/dd HH:mm")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
