export default function MenuLoading() {
  return (
    <div className="flex min-h-screen flex-col animate-pulse">
      <div className="border-b px-4 py-4">
        <div className="h-7 w-28 rounded-lg bg-muted" />
        <div className="mt-1 h-4 w-40 rounded bg-muted" />
      </div>

      <div className="sticky top-0 z-10 flex gap-2 bg-background px-4 py-2 shadow-sm">
        {[80, 64, 72].map((w, i) => (
          <div
            key={i}
            style={{ width: w }}
            className="h-11 shrink-0 rounded-full bg-muted"
          />
        ))}
      </div>

      <main className="flex-1 space-y-6 px-4 pb-28 pt-4">
        {[3, 2].map((count, si) => (
          <section key={si}>
            <div className="mb-3 h-3 w-16 rounded bg-muted" />
            <div className="space-y-2">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm"
                >
                  <div className="h-20 w-20 shrink-0 rounded-lg bg-muted" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-4 w-1/4 rounded bg-muted" />
                  </div>
                  <div className="h-11 w-11 shrink-0 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
