import { Skeleton } from "@/components/ui/skeleton";

export default function OrderTrackingLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>

      <div className="flex-1 space-y-4 px-4 py-6">
        {/* Status card */}
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          {/* Progress steps skeleton */}
          <div className="flex items-center justify-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="mt-1 h-3 w-12" />
                </div>
                {i < 2 && <Skeleton className="mb-5 h-0.5 w-10" />}
              </div>
            ))}
          </div>
        </div>

        {/* Items card */}
        <div className="space-y-3 rounded-2xl border p-4">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
          <div className="flex justify-between border-t pt-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
