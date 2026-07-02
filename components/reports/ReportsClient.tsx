"use client";

import { useEffect, useState } from "react";
import { DateFilter, type DateRange } from "./DateFilter";
import { SummaryKPIs } from "./SummaryKPIs";
import { RevenueChart } from "./RevenueChart";
import { BestSellingProducts } from "./BestSellingProducts";
import { RevenueByCategoryChart } from "./RevenueByCategoryChart";
import { startOfDayHCM, toInputDateHCM } from "@/lib/utils/timezone";
import { PageHeader } from "@/components/layout/PageHeader";

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
      <PageHeader title="Báo cáo" sticky />

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
