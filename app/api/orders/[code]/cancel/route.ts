import { type NextRequest } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { cancelOrder, getOrderByCode } from "@/lib/services/order.service";
import { ORDER_CODE_RE } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!ORDER_CODE_RE.test(code)) {
      return errorResponse("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404);
    }

    const body = await req.json().catch(() => null);
    const orderId = typeof body?.order_id === "string" ? body.order_id : null;
    if (!orderId) {
      return errorResponse("VALIDATION_ERROR", "Thiếu order_id.", 400);
    }

    const existing = await getOrderByCode(code);
    if (existing.id !== orderId) {
      return errorResponse("FORBIDDEN", "Không có quyền hủy đơn này.", 403);
    }

    const order = await cancelOrder(code, "customer");
    return Response.json({
      order_code: order.order_code,
      status: order.status,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
