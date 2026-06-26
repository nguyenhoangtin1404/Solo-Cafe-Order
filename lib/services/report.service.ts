import * as reportRepo from "@/lib/repositories/report.repository";

export interface SummaryResult {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  itemsSold: number;
}

export async function getSummary(from: Date, to: Date): Promise<SummaryResult> {
  const { revenue, orderCount, itemsSold } = await reportRepo.fetchSummaryData(
    from,
    to
  );

  const avgOrderValue = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

  return { revenue, orderCount, avgOrderValue, itemsSold };
}
