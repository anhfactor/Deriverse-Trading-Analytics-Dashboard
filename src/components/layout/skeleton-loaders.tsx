"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/60 ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="h-7 w-40" />
          <Shimmer className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-9 w-[160px]" />
          <Shimmer className="h-9 w-[120px]" />
          <Shimmer className="h-9 w-[120px]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Shimmer className="h-3 w-20" />
              <Shimmer className="h-6 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Shimmer className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Shimmer className="h-[300px] w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Shimmer className="h-[180px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function JournalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="h-7 w-48" />
          <Shimmer className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-9 w-[160px]" />
          <Shimmer className="h-9 w-[120px]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 space-y-2">
              <Shimmer className="h-3 w-16" />
              <Shimmer className="h-5 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            <Shimmer className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-3 border-t border-border">
                <Shimmer className="h-4 w-20" />
                <Shimmer className="h-4 w-16" />
                <Shimmer className="h-4 w-12" />
                <Shimmer className="h-4 w-24" />
                <Shimmer className="h-4 w-16" />
                <Shimmer className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Shimmer className="h-7 w-48" />
        <Shimmer className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-6 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Shimmer className="h-10 w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3 border-t border-border">
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Shimmer className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <Shimmer className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
