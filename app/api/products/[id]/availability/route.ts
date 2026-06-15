import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { setProductAvailability } from "@/lib/services/product.service";

const bodySchema = z.object({ is_available: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOwner();

    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "ID sản phẩm không hợp lệ.",
        400
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const result = await setProductAvailability(id, parsed.data.is_available);
    return Response.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
