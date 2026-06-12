import { type NextRequest } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { cancelOrder } from "@/lib/services/order.service";
import { ORDER_CODE_RE } from "@/lib/constants";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!ORDER_CODE_RE.test(code)) {
      return errorResponse("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404);
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
