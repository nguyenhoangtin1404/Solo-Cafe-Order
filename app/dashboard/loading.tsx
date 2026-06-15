import { Skeleton } from "@/components/ui/skeleton";

function OrderCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      {/* Header: code + status + time */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-10" />
      </div>
      {/* Pickup name */}
      <Skeleton className="mb-3 h-4 w-32" />
      {/* Items */}
      <div className="mb-3 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background">
        {/* Header */}
        <header className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Dashboard</h1>
            <Skeleton className="h-4 w-10" />
          </div>
        </header>

        {/* Audio banner — always visible on first load (unlocked starts false) */}
        <div className="w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-center">
          <Skeleton className="mx-auto h-4 w-56" />
        </div>

        {/* Tab bar */}
        <div className="border-b">
          <div className="flex px-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[44px] items-center gap-1.5 px-3 py-2"
              >
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order cards */}
      <main className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </main>
    </div>
  );
}
