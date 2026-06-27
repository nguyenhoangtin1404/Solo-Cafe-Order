import * as reportRepo from "@/lib/repositories/report.repository";
import {
  addDaysHCM,
  startOfDayHCM,
  toInputDateHCM,
} from "@/lib/utils/timezone";

export interface SummaryResult {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  itemsSold: number;
}

export interface RevenueTrendPoint {
  label: string;
  revenue: number;
}

export interface RevenueTrendResult {
  data: RevenueTrendPoint[];
  groupBy: "hour" | "day";
}

export async function getRevenueTrend(
  from: Date,
  to: Date
): Promise<RevenueTrendResult> {
  const sameDay = toInputDateHCM(from) === toInputDateHCM(to);

  if (sameDay) {
    const rows = await reportRepo.fetchRevenueByHour(from, to);
    const dbMap = new Map(rows.map((r) => [r.hour, r.revenue]));
    const data = Array.from({ length: 24 }, (_, h) => ({
      label: `${h}h`,
      revenue: dbMap.get(h) ?? 0,
    }));
    return { data, groupBy: "hour" };
  }

  const rows = await reportRepo.fetchRevenueByDay(from, to);
  const dbMap = new Map(rows.map((r) => [r.day, r.revenue]));
  const days = enumerateDays(from, to);
  const data = days.map((day) => ({
    label: formatDayLabel(day),
    revenue: dbMap.get(day) ?? 0,
  }));
  return { data, groupBy: "day" };
}

function enumerateDays(from: Date, to: Date): string[] {
  const days: string[] = [];
  let cur = startOfDayHCM(from);
  const end = startOfDayHCM(to);
  while (cur.getTime() <= end.getTime()) {
    days.push(toInputDateHCM(cur));
    cur = addDaysHCM(cur, 1);
  }
  return days;
}

function formatDayLabel(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

export interface BestSellingProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export async function getBestSellingProducts(
  from: Date,
  to: Date
): Promise<BestSellingProduct[]> {
  return reportRepo.fetchBestSellingProducts(from, to);
}

export interface CategoryRevenueItem {
  name: string;
  revenue: number;
  percentage: number;
}

export async function getRevenueByCategory(
  from: Date,
  to: Date
): Promise<CategoryRevenueItem[]> {
  const rows = await reportRepo.fetchRevenueByCategory(from, to);
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);
  if (total === 0) {
    return rows.map((r) => ({
      name: r.categoryName,
      revenue: r.revenue,
      percentage: 0,
    }));
  }
  // Largest-remainder method: guarantees percentages sum to exactly 100.
  // Sort indices by remainder DESC to pick bonus recipients without disturbing
  // the original revenue-DESC order returned by the RPC.
  const withRemainders = rows.map((r) => {
    const exact = (r.revenue / total) * 100;
    return {
      name: r.categoryName,
      revenue: r.revenue,
      floor: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });
  const remaining = 100 - withRemainders.reduce((s, r) => s + r.floor, 0);
  const bonusIndices = new Set(
    [...withRemainders.keys()]
      .sort((a, b) => withRemainders[b].remainder - withRemainders[a].remainder)
      .slice(0, remaining)
  );
  return withRemainders.map((r, i) => ({
    name: r.name,
    revenue: r.revenue,
    percentage: r.floor + (bonusIndices.has(i) ? 1 : 0),
  }));
}

export async function getSummary(from: Date, to: Date): Promise<SummaryResult> {
  const { revenue, orderCount, itemsSold } = await reportRepo.fetchSummaryData(
    from,
    to
  );

  const avgOrderValue = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

  return { revenue, orderCount, avgOrderValue, itemsSold };
}
