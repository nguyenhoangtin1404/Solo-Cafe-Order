import { AppError } from "@/lib/errors";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { MAKING_ORDER_WEIGHT, ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus, PaymentMethod } from "@/lib/constants";
import {
  getPreviousDayHCMBounds,
  getTodayHCMBounds,
} from "@/lib/utils/timezone";
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

const WITH_ITEMS = "*, items:order_items(*)";

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const supabase = createAdminSupabaseClient();

  const { data: rpcResult, error } = await supabase.rpc("create_order", {
    p_pickup_name: data.pickup_name,
    p_note: data.note,
    p_payment_method: data.payment_method,
    p_total_amount: data.total_amount,
    p_items: data.items,
  });
  if (error) throw error;

  if (typeof rpcResult !== "string" || !rpcResult) {
    throw new Error(
      `create_order RPC returned unexpected result: ${JSON.stringify(rpcResult)}`
    );
  }

  const order = await findById(rpcResult);
  if (!order) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Đơn hàng đã được tạo nhưng không thể tải thông tin. Vui lòng hỏi nhân viên để biết mã đơn.",
      500
    );
  }
  return order;
}

async function findByCodeInBounds(
  orderCode: string,
  start: string,
  end: string
): Promise<Order | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(WITH_ITEMS)
    .eq("order_code", orderCode)
    .gte("created_at", start)
    .lt("created_at", end)
    .maybeSingle();

  if (error) throw error;
  return data as Order | null;
}

export async function findByCode(orderCode: string): Promise<Order | null> {
  // Prefer today — order_code resets daily (A001 today ≠ A001 yesterday).
  const today = getTodayHCMBounds();
  const match = await findByCodeInBounds(orderCode, today.start, today.end);
  if (match) return match;

  // Fallback: previous HCM day — e.g. order at 21:59 still trackable after 00:02.
  const yesterday = getPreviousDayHCMBounds();
  return findByCodeInBounds(orderCode, yesterday.start, yesterday.end);
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
  status: OrderStatus,
  expectedCurrentStatus: OrderStatus,
  cancelledBy?: "customer" | "owner"
): Promise<Order | null> {
  const supabase = createAdminSupabaseClient();
  const updateData: {
    status: OrderStatus;
    cancelled_by?: "customer" | "owner";
  } = { status };
  if (cancelledBy) updateData.cancelled_by = cancelledBy;

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .eq("status", expectedCurrentStatus)
    .select(WITH_ITEMS)
    .maybeSingle();

  if (error) throw error;
  return data as Order | null;
}

export async function listByStatus(status: OrderStatus): Promise<Order[]> {
  const supabase = createAdminSupabaseClient();
  const { start, end } = getTodayHCMBounds();

  const { data, error } = await supabase
    .from("orders")
    .select(WITH_ITEMS)
    .gte("created_at", start)
    .lt("created_at", end)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Order[];
}

export interface ListPaginatedResult {
  orders: Order[];
  next_cursor: string | null;
}

export async function listPaginated(
  status: OrderStatus | undefined,
  cursor: string | undefined, // UUID v7 id of the last seen order
  limit: number
): Promise<ListPaginatedResult> {
  const supabase = createAdminSupabaseClient();
  const { start, end } = getTodayHCMBounds();

  // Sort by (created_at DESC, id DESC) for stable ordering.
  // Cursor = UUID v7 id: since v7 encodes timestamp in the high bits,
  // id < cursor means "created before cursor" — collision-free keyset pagination.
  let query = supabase
    .from("orders")
    .select(WITH_ITEMS)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1); // fetch one extra to detect next page

  if (status !== undefined) query = query.eq("status", status);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as Order[];
  const hasNext = rows.length > limit;
  const orders = hasNext ? rows.slice(0, limit) : rows;
  const next_cursor = hasNext ? (orders[orders.length - 1]?.id ?? null) : null;
  return { orders, next_cursor };
}

// Returns a weighted count: NEW orders × 1.0, MAKING orders × MAKING_ORDER_WEIGHT.
// MAKING orders are already being prepared so they contribute less to the wait estimate.
export async function countPending(): Promise<number> {
  const supabase = createAdminSupabaseClient();
  const { start, end } = getTodayHCMBounds();
  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .in("status", [ORDER_STATUS.NEW, ORDER_STATUS.MAKING])
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) throw error;
  return (data ?? []).reduce(
    (sum, r) =>
      sum + (r.status === ORDER_STATUS.MAKING ? MAKING_ORDER_WEIGHT : 1),
    0
  );
}
