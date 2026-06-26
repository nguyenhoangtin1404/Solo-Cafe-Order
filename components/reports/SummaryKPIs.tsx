"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CircleDollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import type { SummaryResult } from "@/lib/services/report.service";
import { formatCurrency } from "@/lib/utils/format";
import type { DateRange } from "./DateFilter";

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

const CARDS: {
  icon: React.ElementType;
  label: string;
  key: keyof SummaryResult;
  format: (n: number) => string;
}[] = [
  {
    icon: CircleDollarSign,
    label: "Doanh thu",
    key: "revenue",
    format: formatCurrency,
  },
  {
    icon: ShoppingBag,
    label: "Đơn hoàn thành",
    key: "orderCount",
    format: (n) => n.toLocaleString("vi-VN"),
  },
  {
    icon: TrendingUp,
    label: "Giá trị trung bình",
    key: "avgOrderValue",
    format: formatCurrency,
  },
  {
    icon: Package,
    label: "Sản phẩm đã bán",
    key: "itemsSold",
    format: (n) => n.toLocaleString("vi-VN"),
  },
];

interface FetchedState {
  data: SummaryResult | null;
  fromMs: number;
  toMs: number;
  error: boolean;
}

interface Props {
  dateRange: DateRange;
}

export function SummaryKPIs({ dateRange }: Props) {
  const [fetched, setFetched] = useState<FetchedState | null>(null);

  const fromMs = dateRange.from.getTime();
  const toMs = dateRange.to.getTime();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
    });

    fetch(`/api/reports/summary?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<SummaryResult>;
      })
      .then((data) => setFetched({ data, fromMs, toMs, error: false }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFetched({ data: null, fromMs, toMs, error: true });
      });

    return () => controller.abort();
  }, [fromMs, toMs]);

  // Derive loading: no result yet, or result is for a different date range
  const isLoading = !fetched || fetched.fromMs !== fromMs || fetched.toMs !== toMs;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CARDS.map((c) => (
          <KPICardSkeleton key={c.key} />
        ))}
      </div>
    );
  }

  if (fetched.error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle size={16} aria-hidden="true" />
        Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.
      </div>
    );
  }

  const d = fetched.data!;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map((c) => (
        <KPICard key={c.key} icon={c.icon} label={c.label} value={c.format(d[c.key])} />
      ))}
    </div>
  );
}
