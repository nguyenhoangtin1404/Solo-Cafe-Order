"use client";

import { useState } from "react";
import { DateFilter, type DateRange } from "./DateFilter";
import { startOfDayHCM } from "@/lib/utils/timezone";

export function ReportsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfDayHCM(new Date()),
    to: new Date(), // "hôm nay đến hiện tại" per spec
  }));

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <h1 className="text-lg font-bold">Báo cáo</h1>
      </header>

      <main className="space-y-4 p-4">
        {/* Date filter */}
        <DateFilter value={dateRange} onChange={setDateRange} />

        {/* Widget grid — slots to be filled by follow-up issues.
            Data must flow through /api/reports/... API routes, not direct Supabase calls. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WidgetPlaceholder label="Tổng doanh thu" />
          <WidgetPlaceholder label="Tổng đơn hàng" />
          <WidgetPlaceholder label="Đơn trung bình" />
        </div>

        <WidgetPlaceholder label="Biểu đồ doanh thu" tall />
        <WidgetPlaceholder label="Danh mục sản phẩm" tall />
        <WidgetPlaceholder label="Sản phẩm bán chạy" tall />
      </main>
    </div>
  );
}

function WidgetPlaceholder({ label, tall }: { label: string; tall?: boolean }) {
  return (
    // TODO: remove animate-pulse when real widget data is wired up
    <div
      aria-busy="true"
      aria-label={`Đang tải: ${label}`}
      className={`animate-pulse rounded-xl border bg-muted/30 ${tall ? "h-48 sm:h-64" : "h-28"} flex items-center justify-center`}
    >
      <span aria-hidden="true" className="text-sm text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
