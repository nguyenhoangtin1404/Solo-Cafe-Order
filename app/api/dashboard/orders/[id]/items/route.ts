import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { getOrderById } from "@/lib/services/order.service";
import { toItemDto } from "@/lib/dto/order";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner();

    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return errorResponse("VALIDATION_ERROR", "ID đơn hàng không hợp lệ.", 400);
    }

    const order = await getOrderById(id);
    return Response.json({ items: order.items.map(toItemDto) });
  } catch (err) {
    return handleRouteError(err);
  }
}
