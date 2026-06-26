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
    const data = Array.from({ length: 23 }, (_, h) => ({
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

export async function getSummary(from: Date, to: Date): Promise<SummaryResult> {
  const { revenue, orderCount, itemsSold } = await reportRepo.fetchSummaryData(
    from,
    to
  );

  const avgOrderValue = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

  return { revenue, orderCount, avgOrderValue, itemsSold };
}
