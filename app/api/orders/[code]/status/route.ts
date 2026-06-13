import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { updateStatus } from "@/lib/services/order.service";
import { updateStatusSchema } from "@/lib/validators";

// [code] param here is the order UUID (not order_code) — owner dashboard
// references orders by id for security; order_code is display-only.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await requireOwner();

    const { code: id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return errorResponse("VALIDATION_ERROR", "ID đơn hàng không hợp lệ.", 400);
    }

    const body = await req.json().catch(() => null);
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const order = await updateStatus(id, parsed.data.status);
    return Response.json({
      id: order.id,
      order_code: order.order_code,
      status: order.status,
      updated_at: order.updated_at,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
