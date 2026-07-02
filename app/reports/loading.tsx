import { HEADER_BAR_CLASS } from "@/components/layout/PageHeader";

export default function ReportsLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải báo cáo…"
      className="min-h-screen bg-background pb-24"
    >
      <header className={`sticky top-0 z-10 ${HEADER_BAR_CLASS}`}>
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
      </header>

      <main className="space-y-4 p-4">
        {/* DateFilter skeleton */}
        <div className="h-11 w-full animate-pulse rounded-lg bg-muted sm:w-64" />

        {/* Stat cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>

        {/* Chart skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl bg-muted sm:h-64"
          />
        ))}
      </main>
    </div>
  );
}
