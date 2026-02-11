"use client";

import { useState } from "react";
import { Trade, JournalAnnotation } from "@/types";
import { useTradingStore } from "@/store/use-trading-store";
import { formatUsd, formatPercent, formatDuration } from "@/lib/analytics";
import { format, differenceInMinutes } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronUp,
  ChevronDown,
  Star,
  Download,
  Search,
  MessageSquare,
  ExternalLink,
  Tag,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TradeReplay } from "@/components/journal/trade-replay";

type SortField = "entryTime" | "pnl" | "pnlPercent" | "size" | "fees" | "symbol";
type SortDir = "asc" | "desc";

interface TradeTableProps {
  trades: Trade[];
}

export function TradeTable({ trades }: TradeTableProps) {
  const { annotations, setAnnotation } = useTradingStore();
  const [sortField, setSortField] = useState<SortField>("entryTime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [pnlFilter, setPnlFilter] = useState<"all" | "winners" | "losers">("all");

  const filtered = trades
    .filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !t.symbol.toLowerCase().includes(q) &&
          !t.side.toLowerCase().includes(q) &&
          !t.orderType.toLowerCase().includes(q)
        )
          return false;
      }
      if (pnlFilter === "winners" && t.pnl <= 0) return false;
      if (pnlFilter === "losers" && t.pnl > 0) return false;

      const annotation = annotations[t.id];
      if (searchQuery && annotation) {
        const q = searchQuery.toLowerCase();
        if (
          annotation.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          annotation.notes.toLowerCase().includes(q)
        )
          return true;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "entryTime":
          cmp = a.entryTime.getTime() - b.entryTime.getTime();
          break;
        case "pnl":
          cmp = a.pnl - b.pnl;
          break;
        case "pnlPercent":
          cmp = a.pnlPercent - b.pnlPercent;
          break;
        case "size":
          cmp = a.size * a.entryPrice - b.size * b.entryPrice;
          break;
        case "fees":
          cmp = a.fees - b.fees;
          break;
        case "symbol":
          cmp = a.symbol.localeCompare(b.symbol);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    );
  };

  const exportCsv = () => {
    const headers = [
      "Date",
      "Symbol",
      "Side",
      "Market",
      "Order Type",
      "Entry Price",
      "Exit Price",
      "Size",
      "Leverage",
      "PnL",
      "PnL %",
      "Fees",
      "Duration",
      "Tags",
      "Notes",
    ];
    const rows = filtered.map((t) => {
      const ann = annotations[t.id];
      const duration =
        t.exitTime ? formatDuration(differenceInMinutes(t.exitTime, t.entryTime)) : "-";
      return [
        format(t.entryTime, "yyyy-MM-dd HH:mm"),
        t.symbol,
        t.side,
        t.marketType,
        t.orderType,
        t.entryPrice.toFixed(4),
        t.exitPrice?.toFixed(4) || "-",
        (t.size * t.entryPrice).toFixed(2),
        t.leverage,
        t.pnl.toFixed(2),
        t.pnlPercent.toFixed(2),
        t.fees.toFixed(4),
        duration,
        ann?.tags.join(";") || "",
        ann?.notes || "",
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deriverse-trades-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTag = (tradeId: string) => {
    if (!tagInput.trim()) return;
    const current = annotations[tradeId];
    const tags = current?.tags || [];
    if (!tags.includes(tagInput.trim())) {
      setAnnotation(tradeId, { tags: [...tags, tagInput.trim()] });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tradeId: string, tag: string) => {
    const current = annotations[tradeId];
    if (current) {
      setAnnotation(tradeId, { tags: current.tags.filter((t) => t !== tag) });
    }
  };

  const handleRating = (tradeId: string, rating: number) => {
    setAnnotation(tradeId, { rating });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by symbol, side, tag, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Select value={pnlFilter} onValueChange={(v) => setPnlFilter(v as typeof pnlFilter)}>
          <SelectTrigger className="w-[120px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            <SelectItem value="winners">Winners</SelectItem>
            <SelectItem value="losers">Losers</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
        <span className="text-xs text-muted-foreground">{filtered.length} trades</span>
      </div>

      <ScrollArea className="h-[600px] rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-[140px] cursor-pointer" onClick={() => handleSort("entryTime")}>
                Date <SortIcon field="entryTime" />
              </TableHead>
              <TableHead className="text-xs cursor-pointer" onClick={() => handleSort("symbol")}>
                Symbol <SortIcon field="symbol" />
              </TableHead>
              <TableHead className="text-xs">Side</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs text-right">Entry</TableHead>
              <TableHead className="text-xs text-right">Exit</TableHead>
              <TableHead className="text-xs text-right cursor-pointer" onClick={() => handleSort("size")}>
                Size <SortIcon field="size" />
              </TableHead>
              <TableHead className="text-xs text-right cursor-pointer" onClick={() => handleSort("pnl")}>
                PnL <SortIcon field="pnl" />
              </TableHead>
              <TableHead className="text-xs text-right cursor-pointer" onClick={() => handleSort("fees")}>
                Fees <SortIcon field="fees" />
              </TableHead>
              <TableHead className="text-xs">Duration</TableHead>
              <TableHead className="text-xs w-[60px]">Tags</TableHead>
              <TableHead className="text-xs w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((trade) => {
              const annotation = annotations[trade.id];
              const duration = trade.exitTime
                ? formatDuration(differenceInMinutes(trade.exitTime, trade.entryTime))
                : "-";

              return (
                <TableRow
                  key={trade.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => setSelectedTrade(trade)}
                >
                  <TableCell className="text-xs font-mono">
                    {format(trade.entryTime, "MM/dd HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{trade.symbol}</span>
                      {trade.marketType === "perp" && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {trade.leverage}x
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        trade.side === "long"
                          ? "border-emerald-500/30 text-emerald-500"
                          : "border-red-500/30 text-red-500"
                      )}
                    >
                      {trade.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">
                    {trade.orderType}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    ${trade.entryPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {formatUsd(trade.size * trade.entryPrice)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-xs text-right font-mono font-medium",
                      trade.pnl > 0 ? "text-emerald-500" : trade.pnl < 0 ? "text-red-500" : ""
                    )}
                  >
                    {trade.status === "closed" ? (
                      <div>
                        <div>{formatUsd(trade.pnl)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatPercent(trade.pnlPercent)}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">OPEN</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono text-muted-foreground">
                    {formatUsd(trade.fees)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{duration}</TableCell>
                  <TableCell>
                    {annotation?.tags && annotation.tags.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {annotation.tags.length}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {annotation?.notes && (
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        {selectedTrade && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <span>{selectedTrade.symbol}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    selectedTrade.side === "long"
                      ? "border-emerald-500/30 text-emerald-500"
                      : "border-red-500/30 text-red-500"
                  )}
                >
                  {selectedTrade.side.toUpperCase()}
                </Badge>
                {selectedTrade.marketType === "perp" && (
                  <Badge variant="outline" className="text-[10px]">
                    {selectedTrade.leverage}x
                  </Badge>
                )}
                <span
                  className={cn(
                    "ml-auto text-sm font-bold",
                    selectedTrade.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {formatUsd(selectedTrade.pnl)}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedTrade.status === "closed" && (
                <div className="rounded-lg border border-border p-3">
                  <TradeReplay trade={selectedTrade} />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-border p-2">
                  <p className="text-muted-foreground">Entry</p>
                  <p className="font-mono font-medium">${selectedTrade.entryPrice.toFixed(4)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(selectedTrade.entryTime, "MMM d, HH:mm")}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <p className="text-muted-foreground">Exit</p>
                  <p className="font-mono font-medium">
                    {selectedTrade.exitPrice ? `$${selectedTrade.exitPrice.toFixed(4)}` : "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedTrade.exitTime ? format(selectedTrade.exitTime, "MMM d, HH:mm") : "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <p className="text-muted-foreground">Fees</p>
                  <p className="font-mono font-medium">{formatUsd(selectedTrade.fees)}</p>
                  {selectedTrade.makerRebate > 0 && (
                    <p className="text-[10px] text-emerald-500">
                      Rebate: {formatUsd(selectedTrade.makerRebate)}
                    </p>
                  )}
                </div>
              </div>

              {selectedTrade.txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${selectedTrade.txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Solana Explorer
                </a>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(selectedTrade.id, star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition-colors",
                          (annotations[selectedTrade.id]?.rating || 0) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground hover:text-amber-400/50"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {(annotations[selectedTrade.id]?.tags || []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/20"
                      onClick={() => handleRemoveTag(selectedTrade.id, tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTag(selectedTrade.id);
                    }}
                    className="h-8 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleAddTag(selectedTrade.id)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["breakout", "reversal", "trend", "scalp", "swing", "mistake", "emotional"].map(
                    (preset) => (
                      <Badge
                        key={preset}
                        variant="outline"
                        className="text-[9px] cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setTagInput(preset);
                          handleAddTag(selectedTrade.id);
                          const current = annotations[selectedTrade.id];
                          const tags = current?.tags || [];
                          if (!tags.includes(preset)) {
                            setAnnotation(selectedTrade.id, { tags: [...tags, preset] });
                          }
                        }}
                      >
                        {preset}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium">Notes</p>
                <Textarea
                  placeholder="Trade rationale, lessons learned..."
                  value={annotations[selectedTrade.id]?.notes || ""}
                  onChange={(e) =>
                    setAnnotation(selectedTrade.id, { notes: e.target.value })
                  }
                  className="text-xs min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium">Screenshot URL</p>
                <Input
                  placeholder="https://..."
                  value={annotations[selectedTrade.id]?.screenshotUrl || ""}
                  onChange={(e) =>
                    setAnnotation(selectedTrade.id, { screenshotUrl: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
