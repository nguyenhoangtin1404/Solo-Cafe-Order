import { Skeleton } from "@/components/ui/skeleton";

function MenuCardSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl bg-card p-3 shadow-sm">
      <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
    </div>
  );
}

export default function MenuLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b px-4 py-4">
        <h1 className="text-xl font-bold">Vibe Cafe ☕</h1>
        <p className="text-sm text-muted-foreground">Chọn đồ uống yêu thích</p>
      </header>

      {/* Category tabs skeleton */}
      <div className="sticky top-0 z-10 flex gap-2 overflow-x-hidden bg-background px-4 py-2 shadow-sm">
        <Skeleton className="h-11 w-16 shrink-0 rounded-full" />
        <Skeleton className="h-11 w-20 shrink-0 rounded-full" />
        <Skeleton className="h-11 w-24 shrink-0 rounded-full" />
        <Skeleton className="h-11 w-20 shrink-0 rounded-full" />
      </div>

      {/* Menu sections */}
      <main className="flex-1 space-y-6 px-4 pb-28 pt-4">
        {Array.from({ length: 2 }).map((_, section) => (
          <section key={section} className="space-y-3">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <MenuCardSkeleton key={i} />
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
