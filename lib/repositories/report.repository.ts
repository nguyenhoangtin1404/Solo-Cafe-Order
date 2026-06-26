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
