import { type NextRequest } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { getOrderByCode } from "@/lib/services/order.service";
import type { OrderItem } from "@/types/order";
import { ORDER_CODE_RE } from "@/lib/constants";

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
    if (!ORDER_CODE_RE.test(code)) {
      return errorResponse("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404);
    }
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
