"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { DateRange } from "./DateFilter";
import type { RevenueTrendPoint } from "@/lib/services/report.service";

interface FetchedState {
  data: RevenueTrendPoint[];
  groupBy: "hour" | "day";
  fromMs: number;
  toMs: number;
  error: boolean;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p className="font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function yFormatter(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function RevenueChartInner({
  data,
  groupBy,
}: {
  data: RevenueTrendPoint[];
  groupBy: "hour" | "day";
}) {
  const commonProps = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
  };
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        interval={groupBy === "hour" ? 2 : "preserveStartEnd"}
      />
      <YAxis
        tickFormatter={yFormatter}
        tick={{ fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        width={48}
      />
    </>
  );

  if (groupBy === "hour") {
    return (
      <BarChart {...commonProps}>
        {axes}
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar
          dataKey="revenue"
          fill="hsl(var(--primary))"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    );
  }
  return (
    <LineChart {...commonProps}>
      {axes}
      <Tooltip content={<ChartTooltip />} />
      <Line
        dataKey="revenue"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4 }}
      />
    </LineChart>
  );
}

export function RevenueChart({ dateRange }: { dateRange: DateRange }) {
  const [fetched, setFetched] = useState<FetchedState | null>(null);

  const fromMs = dateRange.from.getTime();
  const toMs = dateRange.to.getTime();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
    });

    fetch(`/api/reports/revenue?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<{
          data: RevenueTrendPoint[];
          groupBy: "hour" | "day";
        }>;
      })
      .then(({ data, groupBy }) =>
        setFetched({ data, groupBy, fromMs, toMs, error: false })
      )
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFetched({
          data: [],
          groupBy: "hour",
          fromMs,
          toMs,
          error: true,
        });
      });

    return () => controller.abort();
  }, [fromMs, toMs]);

  const isLoading =
    !fetched || fetched.fromMs !== fromMs || fetched.toMs !== toMs;

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl border bg-muted/30" />;
  }

  if (fetched.error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle size={16} aria-hidden="true" />
        Không thể tải biểu đồ doanh thu. Vui lòng thử lại.
      </div>
    );
  }

  const title =
    fetched.groupBy === "hour" ? "Doanh thu theo giờ" : "Doanh thu theo ngày";
  const minWidth = fetched.groupBy === "hour" ? 560 : 320;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          <ResponsiveContainer width="100%" height={220}>
            <RevenueChartInner data={fetched.data} groupBy={fetched.groupBy} />
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
