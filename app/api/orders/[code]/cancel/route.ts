import { type NextRequest } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { cancelOrder, getOrderByCode } from "@/lib/services/order.service";
import { checkCancelRateLimit } from "@/lib/ratelimit";
import { ORDER_CODE_RE } from "@/lib/constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";

  try {
    const { allowed, retryAfterSeconds } = await checkCancelRateLimit(ip);
    if (!allowed) {
      return Response.json(
        { code: "RATE_LIMITED", message: "Vui lòng thử lại sau." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    const { code } = await params;
    if (!ORDER_CODE_RE.test(code)) {
      return errorResponse("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404);
    }

    const body = await req.json().catch(() => null);
    const orderId = typeof body?.order_id === "string" ? body.order_id : null;
    if (!orderId || !UUID_RE.test(orderId)) {
      return errorResponse("VALIDATION_ERROR", "order_id không hợp lệ.", 400);
    }

    const existing = await getOrderByCode(code);
    if (existing.id !== orderId) {
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
