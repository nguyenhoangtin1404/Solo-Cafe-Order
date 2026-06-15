export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="sticky top-0 z-10 bg-background">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 rounded-lg bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        </div>

        <div className="border-b">
          <div className="flex gap-1 px-1">
            {[48, 36, 64, 36].map((w, i) => (
              <div
                key={i}
                style={{ width: w }}
                className="my-2 h-9 rounded-lg bg-muted"
              />
            ))}
          </div>
        </div>
      </div>

      <main className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-14 rounded bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
              <div className="h-4 w-10 rounded bg-muted" />
            </div>
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="space-y-1.5">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="h-5 w-20 rounded-full bg-muted" />
              </div>
              <div className="h-11 w-24 rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
