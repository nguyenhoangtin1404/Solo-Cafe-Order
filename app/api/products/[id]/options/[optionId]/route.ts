import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { updateProductOptionSchema } from "@/lib/validators";
import { deleteOption, updateOption } from "@/lib/services/product.service";

type Params = { params: Promise<{ id: string; optionId: string }> };

async function resolveParams(
  params: Params["params"]
): Promise<{ productId: string; optionId: string } | null> {
  const { id, optionId } = await params;
  const uuidSchema = z.string().uuid();
  if (
    !uuidSchema.safeParse(id).success ||
    !uuidSchema.safeParse(optionId).success
  ) {
    return null;
  }
  return { productId: id, optionId };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const ids = await resolveParams(params);
    if (!ids) {
      return errorResponse("VALIDATION_ERROR", "ID không hợp lệ.", 400);
    }

    const body = await req.json().catch(() => null);
    if (body === null) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Request body bị thiếu hoặc không phải JSON.",
        400
      );
    }
    const parsed = updateProductOptionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const option = await updateOption(ids.productId, ids.optionId, parsed.data);
    return Response.json({ option });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const ids = await resolveParams(params);
    if (!ids) {
      return errorResponse("VALIDATION_ERROR", "ID không hợp lệ.", 400);
    }

    await deleteOption(ids.productId, ids.optionId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
