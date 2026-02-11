"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradePattern } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Flame,
  TrendingDown,
  Scale,
  Swords,
  Timer,
  TrendingUp,
  AlertTriangle,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  winning_streak: Flame,
  losing_streak: TrendingDown,
  outsized_position: Scale,
  revenge_trade: Swords,
  overtrading: Timer,
  improving_performance: TrendingUp,
  declining_performance: AlertTriangle,
};

const SEVERITY_STYLES: Record<string, { badge: string; dot: string }> = {
  success: { badge: "border-emerald-500/30 text-emerald-500", dot: "bg-emerald-500" },
  info: { badge: "border-blue-500/30 text-blue-500", dot: "bg-blue-500" },
  warning: { badge: "border-amber-500/30 text-amber-500", dot: "bg-amber-500" },
  danger: { badge: "border-red-500/30 text-red-500", dot: "bg-red-500" },
};

interface PatternsAlertProps {
  patterns: TradePattern[];
}

export function PatternsAlert({ patterns }: PatternsAlertProps) {
  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Pattern Detection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No significant patterns detected in the current selection.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Pattern Detection</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {patterns.length} found
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-3">
          <div className="space-y-2.5">
            {patterns.map((pattern, i) => {
              const Icon = ICON_MAP[pattern.type] || AlertTriangle;
              const styles = SEVERITY_STYLES[pattern.severity] || SEVERITY_STYLES.info;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-accent/30"
                >
                  <div className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    pattern.severity === "success" && "bg-emerald-500/10",
                    pattern.severity === "warning" && "bg-amber-500/10",
                    pattern.severity === "danger" && "bg-red-500/10",
                    pattern.severity === "info" && "bg-blue-500/10",
                  )}>
                    <Icon className={cn(
                      "h-3.5 w-3.5",
                      pattern.severity === "success" && "text-emerald-500",
                      pattern.severity === "warning" && "text-amber-500",
                      pattern.severity === "danger" && "text-red-500",
                      pattern.severity === "info" && "text-blue-500",
                    )} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", styles.badge)}>
                        {pattern.type.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(pattern.detectedAt, "MMM d")}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-snug">{pattern.message}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {pattern.tradeIds.length} trade{pattern.tradeIds.length !== 1 ? "s" : ""} involved
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
