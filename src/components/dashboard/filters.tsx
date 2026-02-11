"use client";

import { useTradingStore } from "@/store/use-trading-store";
import { getUniqueSymbols } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "@/types";
import { useState } from "react";

export function Filters() {
  const { trades, filters, setFilters, resetFilters } = useTradingStore();
  const symbols = getUniqueSymbols(trades);
  const [dateRange, setDateRange] = useState<DateRange | null>(
    filters.dateRange
  );

  const hasActiveFilters =
    filters.symbol || filters.dateRange || filters.side || filters.marketType;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.symbol || "all"}
        onValueChange={(v) => setFilters({ symbol: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-[160px] h-9 text-xs">
          <SelectValue placeholder="All Symbols" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Symbols</SelectItem>
          {symbols.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.marketType || "all"}
        onValueChange={(v) =>
          setFilters({ marketType: v === "all" ? null : (v as "spot" | "perp") })
        }
      >
        <SelectTrigger className="w-[120px] h-9 text-xs">
          <SelectValue placeholder="All Markets" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Markets</SelectItem>
          <SelectItem value="spot">Spot</SelectItem>
          <SelectItem value="perp">Perpetual</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.side || "all"}
        onValueChange={(v) =>
          setFilters({ side: v === "all" ? null : (v as "long" | "short") })
        }
      >
        <SelectTrigger className="w-[120px] h-9 text-xs">
          <SelectValue placeholder="All Sides" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sides</SelectItem>
          <SelectItem value="long">Long</SelectItem>
          <SelectItem value="short">Short</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-2 text-xs font-normal",
              !filters.dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {filters.dateRange
              ? `${format(filters.dateRange.from, "MMM d")} - ${format(
                  filters.dateRange.to,
                  "MMM d"
                )}`
              : "Date Range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={
              dateRange
                ? { from: dateRange.from, to: dateRange.to }
                : undefined
            }
            onSelect={(range) => {
              if (range?.from && range?.to) {
                const dr = { from: range.from, to: range.to };
                setDateRange(dr);
                setFilters({ dateRange: dr });
              } else if (range?.from) {
                setDateRange({ from: range.from, to: range.from });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetFilters();
            setDateRange(null);
          }}
          className="h-9 gap-1 text-xs text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
