import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { submitOrderSchema } from "@/lib/validators";
import { submitOrder } from "@/lib/services/order.service";
import { getBankTransferInfo } from "@/lib/config/bank";
import { handleRouteError } from "@/lib/errors";
import { PAYMENT_METHOD } from "@/lib/constants";
import type { WaitEstimate } from "@/lib/services/order.service";
import type { Order, OrderItem } from "@/types/order";

function getRatelimiter() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:orders",
  });
}

function formatWaitEstimate(estimate: WaitEstimate): string {
  if (estimate.degraded) return "10–20 phút";
  return `${estimate.min}–${estimate.max} phút`;
}

type OrderItemDto = {
  product_name: string;
  quantity: number;
  unit_price: number;
  note: string | null;
  selected_options: OrderItem["selected_options"];
};

function toOrderItemDto(item: OrderItem): OrderItemDto {
  return {
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    note: item.note,
    selected_options: item.selected_options,
  };
}

function toSubmitOrderResponse(order: Order, waitEstimate: WaitEstimate) {
  return {
    order_code: order.order_code,
    pickup_name: order.pickup_name,
    total_amount: order.total_amount,
    payment_method: order.payment_method,
    wait_estimate: formatWaitEstimate(waitEstimate),
    bank_transfer_info:
      order.payment_method === PAYMENT_METHOD.BANK_TRANSFER
        ? getBankTransferInfo()
        : null,
    items: order.items.map(toOrderItemDto),
  };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // Rate limit — 10 req/phút/IP (Upstash sliding window)
  const ratelimiter = getRatelimiter();
  const ip = getClientIp(req);
  const { success, reset } = await ratelimiter.limit(ip);
  if (!success) {
    return Response.json(
      {
        code: "RATE_LIMITED",
        message: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = submitOrderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const { order, wait_estimate } = await submitOrder(parsed.data);
    return Response.json(toSubmitOrderResponse(order, wait_estimate), {
      status: 201,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
