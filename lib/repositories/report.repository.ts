import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { ORDER_STATUS } from "@/lib/constants";

export interface SummaryRawData {
  revenue: number;
  orderCount: number;
  itemsSold: number;
}

interface OrderAggRow {
  total_amount: number;
  items: { quantity: number }[];
}

export async function fetchSummaryData(
  from: Date,
  to: Date
): Promise<SummaryRawData> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select("total_amount, items:order_items(quantity)")
    .eq("status", ORDER_STATUS.DONE)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());

  if (error) throw error;

  const rows = (data ?? []) as OrderAggRow[];
  const revenue = rows.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  const orderCount = rows.length;
  const itemsSold = rows.reduce(
    (sum, o) =>
      sum + (o.items ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0),
    0
  );

  return { revenue, orderCount, itemsSold };
}
