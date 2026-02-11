"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProviderWrapper } from "@/components/layout/wallet-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProviderWrapper>
      <ThemeProvider>
        <TooltipProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-[70px] lg:ml-[240px]">
              <Header />
              <main className="p-6">{children}</main>
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </WalletProviderWrapper>
  );
}
