import { type NextRequest } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { getOrderByCode } from "@/lib/services/order.service";
import type { OrderItem } from "@/types/order";

function toItemDto(item: OrderItem) {
  return {
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    selected_options: item.selected_options,
    note: item.note,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const order = await getOrderByCode(code);
    return Response.json({
      order_code: order.order_code,
      status: order.status,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      pickup_name: order.pickup_name,
      items: order.items.map(toItemDto),
      created_at: order.created_at,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
