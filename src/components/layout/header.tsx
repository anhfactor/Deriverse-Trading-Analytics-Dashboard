"use client";

import { useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { useTradingStore } from "@/store/use-trading-store";
import { connectWallet, disconnectEngine } from "@/lib/deriverse/engine";

// Live data always comes from mainnet via /api/trades

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [lookupAddress, setLookupAddress] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { publicKey, connected } = useWallet();
  const { isDemoMode, setDemoMode, loadMockData, loadLiveData, connectedWallet } = useTradingStore();

  useEffect(() => setMounted(true), []);

  const handleWalletConnect = useCallback(async () => {
    if (connected && publicKey) {
      const walletAddr = publicKey.toBase58();
      await connectWallet(walletAddr);
      setDemoMode(false);
      loadLiveData(walletAddr);
    }
  }, [connected, publicKey, setDemoMode, loadLiveData]);

  useEffect(() => {
    if (connected && publicKey) {
      handleWalletConnect();
    } else {
      disconnectEngine();
      if (!isDemoMode) {
        setDemoMode(true);
        loadMockData();
      }
    }
  }, [connected, publicKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMode = () => {
    const activeWallet = connectedWallet || (connected && publicKey ? publicKey.toBase58() : null);
    if (isDemoMode && activeWallet) {
      setDemoMode(false);
      loadLiveData(activeWallet);
    } else {
      setDemoMode(true);
      loadMockData();
    }
  };

  const handleLookup = () => {
    const addr = lookupAddress.trim();
    if (!addr || addr.length < 32) return;
    setIsLookingUp(false);
    setDemoMode(false);
    loadLiveData(addr);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Trading Analytics</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={`gap-1.5 text-xs font-normal ${
            !isDemoMode
              ? "border-emerald-500/30 text-emerald-500"
              : "border-amber-500/30 text-amber-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full animate-pulse ${
              !isDemoMode ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {!isDemoMode ? "Mainnet" : "Demo"}
        </Badge>

        {/* Wallet address lookup */}
        {mounted && isLookingUp ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Paste wallet address..."
              value={lookupAddress}
              onChange={(e) => setLookupAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="h-7 w-64 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleLookup}>
              Load
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setIsLookingUp(false)}>
              ✕
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs h-7 px-2"
            onClick={() => setIsLookingUp(true)}
            title="Look up any Deriverse trader by wallet address"
          >
            <Search className="h-3.5 w-3.5" />
            Lookup
          </Button>
        )}

        {/* Demo / Live toggle */}
        {mounted && (connected || connectedWallet) ? (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs h-7 px-2"
            onClick={toggleMode}
          >
            {isDemoMode ? (
              <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
            )}
            {isDemoMode ? "Demo" : "Live"}
          </Button>
        ) : (
          <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
            Demo Mode
          </Badge>
        )}
        {mounted && (
          <WalletMultiButton
            style={{
              height: "28px",
              fontSize: "12px",
              padding: "0 12px",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          />
        )}
      </div>
    </header>
  );
}
