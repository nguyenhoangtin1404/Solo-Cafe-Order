"use client";

import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
} from "lucide-react";
import type { DateRange } from "./DateFilter";

interface SummaryData {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  itemsSold: number;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function KPICard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <Icon size={16} aria-hidden="true" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-7 w-32 animate-pulse rounded bg-muted" />
    </div>
  );
}

interface FetchedState {
  data: SummaryData;
  fromMs: number;
  toMs: number;
}

const EMPTY: SummaryData = {
  revenue: 0,
  orderCount: 0,
  avgOrderValue: 0,
  itemsSold: 0,
};

interface Props {
  dateRange: DateRange;
}

export function SummaryKPIs({ dateRange }: Props) {
  const [fetched, setFetched] = useState<FetchedState | null>(null);

  useEffect(() => {
    const fromMs = dateRange.from.getTime();
    const toMs = dateRange.to.getTime();

    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/reports/summary?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<SummaryData>;
      })
      .then((data) => setFetched({ data, fromMs, toMs }))
      .catch(() => setFetched({ data: EMPTY, fromMs, toMs }));
  }, [dateRange.from, dateRange.to]);

  // loading when no data yet, or when dateRange changed and fetch hasn't returned
  const isLoading =
    !fetched ||
    fetched.fromMs !== dateRange.from.getTime() ||
    fetched.toMs !== dateRange.to.getTime();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    );
  }

  const d = fetched.data;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KPICard
        icon={CircleDollarSign}
        label="Doanh thu"
        value={formatVND(d.revenue)}
      />
      <KPICard
        icon={ShoppingBag}
        label="Đơn hoàn thành"
        value={d.orderCount.toLocaleString("vi-VN")}
      />
      <KPICard
        icon={TrendingUp}
        label="Giá trị trung bình"
        value={formatVND(d.avgOrderValue)}
      />
      <KPICard
        icon={Package}
        label="Sản phẩm đã bán"
        value={d.itemsSold.toLocaleString("vi-VN")}
      />
    </div>
  );
}
