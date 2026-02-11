"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PieChart,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[70px] flex-col items-center border-r border-border bg-card py-4 lg:w-[240px]">
      <div className="flex items-center gap-2 px-4 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="hidden text-lg font-bold tracking-tight lg:block">
          Deriverse
        </span>
      </div>

      <Separator className="mb-4 w-10 lg:w-[calc(100%-2rem)]" />

      <nav className="flex flex-1 flex-col gap-1 w-full px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2 px-2 pb-2 w-full">
        <Separator className="mb-2 w-10 lg:w-[calc(100%-1rem)]" />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-center lg:justify-start gap-3 px-3"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          <span className="hidden lg:block">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </Button>
      </div>
    </aside>
  );
}
