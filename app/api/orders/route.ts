import { type NextRequest } from "next/server";
import { z } from "zod";
import { AppError, errorResponse, handleRouteError } from "@/lib/errors";
import { checkOrderRateLimit } from "@/lib/ratelimit";
import { requireOwner } from "@/lib/auth/requireOwner";
import { submitOrder, listOrders } from "@/lib/services/order.service";
import type { WaitEstimate } from "@/lib/services/order.service";
import { ORDER_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import { submitOrderSchema } from "@/lib/validators";
import type { Order, OrderItem } from "@/types/order";

const VALID_STATUSES = new Set<string>([
  ORDER_STATUS.NEW,
  ORDER_STATUS.MAKING,
  ORDER_STATUS.DONE,
  ORDER_STATUS.CANCELLED,
]);

function toOrderDto(order: Order) {
  return {
    id: order.id,
    order_code: order.order_code,
    status: order.status,
    payment_method: order.payment_method,
    total_amount: order.total_amount,
    pickup_name: order.pickup_name,
    note: order.note,
    cancelled_by: order.cancelled_by,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: order.items.map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      selected_options: item.selected_options,
      note: item.note,
    })),
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

    if (statusParam !== undefined && !VALID_STATUSES.has(statusParam)) {
      return errorResponse("VALIDATION_ERROR", "Status không hợp lệ.", 400);
    }
    if (cursor !== undefined && !z.string().uuid().safeParse(cursor).success) {
      return errorResponse("VALIDATION_ERROR", "cursor không hợp lệ.", 400);
    }

    const { orders, next_cursor } = await listOrders(
      statusParam as OrderStatus | undefined,
      cursor,
      limit
    );

    return Response.json({ orders: orders.map(toOrderDto), next_cursor });
  } catch (err) {
    return handleRouteError(err);
  }
}

type BankTransferInfo = {
  bank_name: string;
  account_number: string;
  account_name: string;
  qr_image_url: string | null;
};

function getBankTransferInfo(): BankTransferInfo {
  const bank_name = process.env.BANK_NAME;
  const account_number = process.env.BANK_ACCOUNT_NUMBER;
  const account_name = process.env.BANK_ACCOUNT_NAME;
  if (!bank_name || !account_number || !account_name) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Thông tin chuyển khoản chưa được cấu hình. Vui lòng chọn thanh toán tiền mặt.",
      500
    );
  }
  return {
    bank_name,
    account_number,
    account_name,
    qr_image_url: process.env.NEXT_PUBLIC_BANK_QR_IMAGE_URL ?? null,
  };
}

function formatWaitEstimate(estimate: WaitEstimate): string {
  if (estimate.degraded) return "5–15 phút";
  return `${estimate.min}–${estimate.max} phút`;
}

function toItemDto(item: OrderItem) {
  return {
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    selected_options: item.selected_options,
    note: item.note,
  };
}

export async function POST(req: NextRequest) {
  // Vercel appends the real client IP as the last entry in x-forwarded-for;
  // using the last value prevents spoofing via client-controlled headers.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";

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

    const bank_transfer_info =
      parsed.data.payment_method === PAYMENT_METHOD.BANK_TRANSFER
        ? getBankTransferInfo()
        : null;

    const { order, wait_estimate } = await submitOrder(parsed.data);

    return Response.json(
      {
        order_code: order.order_code,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        wait_estimate: formatWaitEstimate(wait_estimate),
        pickup_name: order.pickup_name,
        items: order.items.map(toItemDto),
        bank_transfer_info,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
