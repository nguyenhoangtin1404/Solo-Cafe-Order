"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { CategoryRevenueItem } from "@/lib/services/report.service";
import { useRevenueByCategory } from "@/hooks/useRevenueByCategory";
import type { DateRange } from "./DateFilter";

const COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#ec4899", // pink
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#ef4444", // red
];

function getColor(index: number): string {
  return COLORS[index % COLORS.length];
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: CategoryRevenueItem;
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-muted-foreground">{item.name}</p>
      <p className="font-bold">{formatCurrency(item.revenue)}</p>
      <p className="text-muted-foreground">{item.percentage}%</p>
    </div>
  );
}

function PieChartContent({ data }: { data: CategoryRevenueItem[] }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="h-48 w-full max-w-xs shrink-0 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              innerRadius="45%"
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={getColor(index)} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <ul className="w-full space-y-2">
        {data.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ background: getColor(index) }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {item.name}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {item.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RevenueByCategoryChart({
  dateRange,
}: {
  dateRange: DateRange;
}) {
  const { isLoading, data, error } = useRevenueByCategory(dateRange);

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Doanh thu theo danh mục</h2>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted/30 sm:h-52" />
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle size={16} aria-hidden="true" />
            Không thể tải dữ liệu. Vui lòng thử lại sau.
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu trong khoảng thời gian này
          </p>
        ) : (
          <PieChartContent data={data} />
        )}
      </div>
    </div>
  );
}
