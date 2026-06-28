import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { getOrderById } from "@/lib/services/order.service";
import { toItemDto } from "@/lib/dto/order";

// Auth-gated endpoint for the owner dashboard to fetch a full order by UUID.
// Not rate-limited — the caller (useOrderQueue) is an authenticated owner session,
// not a public customer. Separate from GET /api/orders/[code] which is public+rate-limited.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner();

    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "ID đơn hàng không hợp lệ.",
        400
      );
    }

    const order = await getOrderById(id);
    return Response.json({
      id: order.id,
      order_code: order.order_code,
      status: order.status,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      pickup_name: order.pickup_name,
      note: order.note,
      customer_ref: order.customer_ref,
      cancelled_by: order.cancelled_by,
      items: order.items.map((item) => toItemDto(item)),
      created_at: order.created_at,
      updated_at: order.updated_at,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
