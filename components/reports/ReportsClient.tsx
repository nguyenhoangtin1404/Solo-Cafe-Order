"use client";

import { useState } from "react";
import { DateFilter, type DateRange } from "./DateFilter";

function startOfTodayHCM(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return new Date(`${y}-${m}-${d}T00:00:00+07:00`);
}

export function ReportsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfTodayHCM(),
    to: new Date(),
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <h1 className="text-lg font-bold">Báo cáo</h1>
      </header>

      <main className="space-y-4 p-4">
        {/* Date filter */}
        <DateFilter value={dateRange} onChange={setDateRange} />

        {/* Widget grid — slots to be filled by follow-up issues */}
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
    <div
      className={`animate-pulse rounded-xl border bg-muted/30 ${tall ? "h-48 sm:h-64" : "h-28"} flex items-center justify-center`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
