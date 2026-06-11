import { type NextRequest } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { cancelOrder } from "@/lib/services/order.service";
import { checkCancelRateLimit } from "@/lib/ratelimit";
import { ORDER_CODE_RE } from "@/lib/constants";
import { cancelBodySchema } from "@/lib/validators";

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
    if (body === null) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Request body không hợp lệ.",
        400
      );
    }
    const parsed = cancelBodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "order_id không hợp lệ.", 400);
    }
    const { order_id: orderId } = parsed.data;

    const order = await cancelOrder(code, "customer", orderId);
    return Response.json({
      order_code: order.order_code,
      status: order.status,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
