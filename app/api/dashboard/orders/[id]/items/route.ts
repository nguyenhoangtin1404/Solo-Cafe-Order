import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { getOrderById } from "@/lib/services/order.service";
import type { OrderItem } from "@/types/order";

function toItemDto(item: OrderItem) {
  return {
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    selected_options: item.selected_options,
    note: item.note,
  };
}

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
