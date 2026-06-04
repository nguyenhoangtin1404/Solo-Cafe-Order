import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus, PaymentMethod } from "@/lib/constants";
import type { Order, SelectedOption } from "@/types/order";

export interface CreateOrderItemData {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  selected_options: SelectedOption[];
  note: string | null;
}

export interface CreateOrderData {
  pickup_name: string | null;
  note: string | null;
  payment_method: PaymentMethod;
  total_amount: number;
  items: CreateOrderItemData[];
}

// UTC boundaries of "today" in Asia/Ho_Chi_Minh (UTC+7)
function getTodayHCMBounds(): { start: string; end: string } {
  const HCM_OFFSET_MS = 7 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const hcmNow = Date.now() + HCM_OFFSET_MS;
  const hcmMidnight = hcmNow - (hcmNow % DAY_MS);
  return {
    start: new Date(hcmMidnight - HCM_OFFSET_MS).toISOString(),
    end: new Date(hcmMidnight + DAY_MS - HCM_OFFSET_MS).toISOString(),
  };
}

const WITH_ITEMS = "*, items:order_items(*)";

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const supabase = createAdminSupabaseClient();

  // Single RPC call: generate_order_code + INSERT orders + INSERT order_items in one transaction.
  // An orphan order row can no longer result from a partial failure.
  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_pickup_name: data.pickup_name,
    p_note: data.note,
    p_payment_method: data.payment_method,
    p_total_amount: data.total_amount,
    p_items: data.items,
  });
  if (error) throw error;

  const order = await findById(orderId as string);
  if (!order) throw new Error("Order not found after creation");
  return order;
}

export async function findByCode(orderCode: string): Promise<Order | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(WITH_ITEMS)
    .eq("order_code", orderCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Order | null;
}

export async function findById(id: string): Promise<Order | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(WITH_ITEMS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Order | null;
}

export async function updateStatus(
  id: string,
  status: OrderStatus
): Promise<Order> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select(WITH_ITEMS)
    .single();

  if (error) throw error;
  return data as Order;
}

export async function listByStatus(status?: OrderStatus): Promise<Order[]> {
  const supabase = createAdminSupabaseClient();
  const { start, end } = getTodayHCMBounds();

  let query = supabase
    .from("orders")
    .select(WITH_ITEMS)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  if (status !== undefined) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function countPending(): Promise<number> {
  const supabase = createAdminSupabaseClient();
  const { start, end } = getTodayHCMBounds();
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", [ORDER_STATUS.NEW, ORDER_STATUS.MAKING])
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) throw error;
  return count ?? 0;
}
