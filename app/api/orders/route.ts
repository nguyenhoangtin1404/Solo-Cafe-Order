import { type NextRequest } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { checkOrderRateLimit } from "@/lib/ratelimit";
import { submitOrder } from "@/lib/services/order.service";
import type { WaitEstimate } from "@/lib/services/order.service";
import { PAYMENT_METHOD } from "@/lib/constants";
import { submitOrderSchema } from "@/lib/validators";
import type { OrderItem } from "@/types/order";

type BankTransferInfo = {
  bank_name: string;
  account_number: string;
  account_name: string;
  qr_image_url: string | null;
};

function getBankTransferInfo(): BankTransferInfo | null {
  const bank_name = process.env.BANK_NAME;
  const account_number = process.env.BANK_ACCOUNT_NUMBER;
  const account_name = process.env.BANK_ACCOUNT_NAME;
  if (!bank_name || !account_number || !account_name) return null;
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
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterSeconds } = await checkOrderRateLimit(ip);
  if (!allowed) {
    return Response.json(
      { code: "RATE_LIMITED", message: "Vui lòng chờ 1 phút rồi thử lại." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = submitOrderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const { order, wait_estimate } = await submitOrder(parsed.data);

    const bank_transfer_info =
      order.payment_method === PAYMENT_METHOD.BANK_TRANSFER
        ? getBankTransferInfo()
        : null;

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
