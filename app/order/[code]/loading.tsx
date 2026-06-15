export default function OrderTrackingLoading() {
  return (
    <div className="flex min-h-screen flex-col animate-pulse">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="h-11 w-11 shrink-0 rounded-full bg-muted" />
        <div className="space-y-1">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 py-6">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center justify-center gap-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="h-3 w-12 rounded bg-muted" />
                </div>
                {i < 3 && <div className="mb-5 h-0.5 w-10 bg-muted" />}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div className="h-5 w-28 rounded bg-muted" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between gap-2">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-4 w-1/5 rounded bg-muted" />
            </div>
          ))}
          <div className="flex justify-between border-t pt-2">
            <div className="h-5 w-12 rounded bg-muted" />
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
