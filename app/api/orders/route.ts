import { type NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { checkOrderRateLimit, getClientIp } from "@/lib/ratelimit";
import { requireOwner } from "@/lib/auth/requireOwner";
import { submitOrder, listOrders } from "@/lib/services/order.service";
import type { WaitEstimate } from "@/lib/services/order.service";
import { ORDER_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import { submitOrderSchema } from "@/lib/validators";
import type { Order, OrderItemSummary } from "@/types/order";
import { toItemDto } from "@/lib/dto/order";
import { getBankTransferInfo } from "@/lib/config/bank";

const VALID_STATUSES = new Set<OrderStatus>(Object.values(ORDER_STATUS));

function isOrderStatus(s: string): s is OrderStatus {
  return (VALID_STATUSES as Set<string>).has(s);
}

type OrderDto = Omit<Order, "items"> & { items: OrderItemSummary[] };

function toOrderDto(order: Order): OrderDto {
  return {
    id: order.id,
    order_code: order.order_code,
    status: order.status,
    payment_method: order.payment_method,
    total_amount: order.total_amount,
    pickup_name: order.pickup_name,
    note: order.note,
    cancelled_by: order.cancelled_by,
    customer_ref: order.customer_ref,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: order.items.map((item) => toItemDto(item)),
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireOwner();

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limit = Math.min(
      Math.max(1, Number(url.searchParams.get("limit")) || 30),
      100
    );

    if (statusParam !== undefined && !isOrderStatus(statusParam)) {
      return errorResponse("VALIDATION_ERROR", "Status không hợp lệ.", 400);
    }
    if (
      cursor !== undefined &&
      !z.string().datetime({ offset: true }).safeParse(cursor).success
    ) {
      return errorResponse("VALIDATION_ERROR", "cursor không hợp lệ.", 400);
    }

    const { orders, next_cursor } = await listOrders(
      statusParam !== undefined && isOrderStatus(statusParam)
        ? statusParam
        : undefined,
      cursor,
      limit
    );

    return Response.json({ orders: orders.map(toOrderDto), next_cursor });
  } catch (err) {
    return handleRouteError(err);
  }
}

function formatWaitEstimate(estimate: WaitEstimate): string {
  if (estimate.degraded) return "5–15 phút";
  return `${estimate.min}–${estimate.max} phút`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const { allowed, retryAfterSeconds } = await checkOrderRateLimit(ip);
    if (!allowed) {
      return Response.json(
        { code: "RATE_LIMITED", message: "Vui lòng chờ 1 phút rồi thử lại." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = submitOrderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    let bank_transfer_info = null;
    if (parsed.data.payment_method === PAYMENT_METHOD.BANK_TRANSFER) {
      bank_transfer_info = getBankTransferInfo();
      if (bank_transfer_info === null) {
        return errorResponse(
          "INTERNAL_ERROR",
          "Thông tin chuyển khoản chưa được cấu hình. Vui lòng chọn thanh toán tiền mặt.",
          500
        );
      }
    }

    const { order, wait_estimate } = await submitOrder(parsed.data);

    return Response.json(
      {
        order_code: order.order_code,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        wait_estimate: formatWaitEstimate(wait_estimate),
        pickup_name: order.pickup_name,
        items: order.items.map((item) => toItemDto(item)),
        bank_transfer_info,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
