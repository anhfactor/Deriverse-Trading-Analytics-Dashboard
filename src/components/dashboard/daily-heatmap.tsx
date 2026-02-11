"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyPnl } from "@/types";
import { formatUsd } from "@/lib/analytics";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DailyHeatmapProps {
  dailyPnl: DailyPnl[];
}

export const DailyHeatmap = memo(function DailyHeatmap({ dailyPnl }: DailyHeatmapProps) {
  const pnlMap = new Map(dailyPnl.map((d) => [d.date, d]));
  const now = new Date();
  const months = Array.from({ length: 3 }, (_, i) => subMonths(now, 2 - i));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Daily PnL Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {months.map((month) => {
            const start = startOfMonth(month);
            const end = endOfMonth(month);
            const days = eachDayOfInterval({ start, end });
            const firstDayOffset = getDay(start);

            return (
              <div key={format(month, "yyyy-MM")} className="min-w-[200px]">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {format(month, "MMMM yyyy")}
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-[9px] text-muted-foreground text-center">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-6 w-6" />
                  ))}
                  {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const data = pnlMap.get(dateStr);
                    const pnl = data?.pnl || 0;
                    const hasData = !!data;

                    let bgClass = "bg-muted/30";
                    if (hasData) {
                      if (pnl > 100) bgClass = "bg-emerald-500";
                      else if (pnl > 50) bgClass = "bg-emerald-500/70";
                      else if (pnl > 0) bgClass = "bg-emerald-500/40";
                      else if (pnl > -50) bgClass = "bg-red-500/40";
                      else if (pnl > -100) bgClass = "bg-red-500/70";
                      else bgClass = "bg-red-500";
                    }

                    return (
                      <Tooltip key={dateStr} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-6 w-6 rounded-sm cursor-default transition-colors",
                              bgClass
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(day, "MMM d, yyyy")}</p>
                          {hasData ? (
                            <>
                              <p className={pnl >= 0 ? "text-emerald-500" : "text-red-500"}>
                                {formatUsd(pnl)}
                              </p>
                              <p className="text-muted-foreground">
                                {data!.tradeCount} trades
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">No trades</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Loss</span>
          <div className="flex gap-0.5">
            <div className="h-3 w-3 rounded-sm bg-red-500" />
            <div className="h-3 w-3 rounded-sm bg-red-500/70" />
            <div className="h-3 w-3 rounded-sm bg-red-500/40" />
            <div className="h-3 w-3 rounded-sm bg-muted/30" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500/40" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500/70" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          </div>
          <span>Profit</span>
        </div>
      </CardContent>
    </Card>
  );
});
