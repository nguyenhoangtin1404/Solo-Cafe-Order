import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export interface SummaryRawData {
  revenue: number;
  orderCount: number;
  itemsSold: number;
}

interface SummaryRpcRow {
  revenue: string | number;
  order_count: string | number;
  items_sold: string | number;
}

interface HourlyRevenueRow {
  hour: string | number;
  revenue: string | number;
}

interface DailyRevenueRow {
  day: string;
  revenue: string | number;
}

export async function fetchRevenueByHour(
  from: Date,
  to: Date
): Promise<{ hour: number; revenue: number }[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_revenue_by_hour", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;
  return ((data ?? []) as HourlyRevenueRow[]).map((r) => ({
    hour: Number(r.hour),
    revenue: Number(r.revenue),
  }));
}

export async function fetchRevenueByDay(
  from: Date,
  to: Date
): Promise<{ day: string; revenue: number }[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_revenue_by_day", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;
  return ((data ?? []) as DailyRevenueRow[]).map((r) => ({
    day: r.day,
    revenue: Number(r.revenue),
  }));
}

export interface BestSellingProductRow {
  product_name: string;
  quantity: string | number;
  revenue: string | number;
}

export async function fetchBestSellingProducts(
  from: Date,
  to: Date
): Promise<{ name: string; quantity: number; revenue: number }[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("get_best_selling_products", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;
  return ((data ?? []) as BestSellingProductRow[]).map((r) => ({
    name: r.product_name,
    quantity: Number(r.quantity),
    revenue: Number(r.revenue),
  }));
}

export async function fetchSummaryData(
  from: Date,
  to: Date
): Promise<SummaryRawData> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc("get_order_summary", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });

  if (error) throw error;

  // RETURNS TABLE yields an array; first (and only) row has the aggregates.
  // PostgreSQL bigint may arrive as a string from the JS client — Number() handles both.
  const row = ((data ?? []) as SummaryRpcRow[])[0];
  return {
    revenue: Number(row?.revenue ?? 0),
    orderCount: Number(row?.order_count ?? 0),
    itemsSold: Number(row?.items_sold ?? 0),
  };
}
