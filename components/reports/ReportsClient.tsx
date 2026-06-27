"use client";

import { useEffect, useState } from "react";
import { DateFilter, type DateRange } from "./DateFilter";
import { SummaryKPIs } from "./SummaryKPIs";
import { RevenueChart } from "./RevenueChart";
import { BestSellingProducts } from "./BestSellingProducts";
import { RevenueByCategoryChart } from "./RevenueByCategoryChart";
import { startOfDayHCM, toInputDateHCM } from "@/lib/utils/timezone";

export function ReportsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfDayHCM(new Date()),
    to: new Date(), // "hôm nay đến hiện tại" per spec
  }));

  useEffect(() => {
    const id = setInterval(() => {
      setDateRange((prev) => {
        if (toInputDateHCM(prev.to) !== toInputDateHCM(new Date())) return prev;
        return { ...prev, to: new Date() };
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

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

        {/* KPI Summary cards */}
        <SummaryKPIs dateRange={dateRange} />

        <RevenueChart dateRange={dateRange} />
        <RevenueByCategoryChart dateRange={dateRange} />
        <BestSellingProducts dateRange={dateRange} />
      </main>
    </div>
  );
}
