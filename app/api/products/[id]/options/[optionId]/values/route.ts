import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { createProductOptionValueSchema } from "@/lib/validators";
import { createOptionValue } from "@/lib/services/product.service";

type Params = { params: Promise<{ id: string; optionId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const { id: productId, optionId } = await params;
    const uuidSchema = z.string().uuid();
    if (
      !uuidSchema.safeParse(productId).success ||
      !uuidSchema.safeParse(optionId).success
    ) {
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
    const parsed = createProductOptionValueSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const value = await createOptionValue(productId, optionId, parsed.data);
    return Response.json({ value }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
