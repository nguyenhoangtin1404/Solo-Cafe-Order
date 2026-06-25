import { Skeleton } from "@/components/ui/skeleton";

function MenuCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm">
      <Skeleton className="aspect-square w-full bg-muted-foreground/10" />
      <div className="space-y-2 p-2.5">
        <Skeleton className="h-4 w-3/4 bg-muted-foreground/10" />
        <Skeleton className="h-4 w-1/2 bg-muted-foreground/10" />
      </div>
    </div>
  );
}

export default function MenuLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="px-4 pb-3 pt-4">
        <Skeleton className="h-7 w-32 bg-card" />
        <Skeleton className="mt-1.5 h-4 w-56 bg-card" />
      </header>

      {/* Search bar skeleton */}
      <div className="px-4 pb-2">
        <Skeleton className="h-11 w-full rounded-xl bg-card" />
      </div>

      {/* Category tabs skeleton */}
      <div className="sticky top-0 z-10 flex gap-2 overflow-x-hidden bg-background px-4 py-2 shadow-sm">
        <Skeleton className="h-11 w-16 shrink-0 rounded-full bg-card" />
        <Skeleton className="h-11 w-20 shrink-0 rounded-full bg-card" />
        <Skeleton className="h-11 w-24 shrink-0 rounded-full bg-card" />
        <Skeleton className="h-11 w-20 shrink-0 rounded-full bg-card" />
      </div>

      {/* Menu sections */}
      <main className="flex-1 space-y-6 px-4 pb-28 pt-4">
        {Array.from({ length: 2 }).map((_, section) => (
          <section key={section}>
            <Skeleton className="mb-3 h-3 w-24 bg-card" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <MenuCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
