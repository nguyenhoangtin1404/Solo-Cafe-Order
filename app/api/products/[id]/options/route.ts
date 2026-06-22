import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { createProductOptionSchema } from "@/lib/validators";
import {
  createOption,
  getOptionsForProduct,
} from "@/lib/services/product.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const { id: productId } = await params;
    if (!z.string().uuid().safeParse(productId).success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "ID sản phẩm không hợp lệ.",
        400
      );
    }

    const options = await getOptionsForProduct(productId);
    return Response.json({ options });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const { id: productId } = await params;
    if (!z.string().uuid().safeParse(productId).success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "ID sản phẩm không hợp lệ.",
        400
      );
    }

    const body = await req.json().catch(() => null);
    if (body === null) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Request body bị thiếu hoặc không phải JSON.",
        400
      );
    }
    const parsed = createProductOptionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const option = await createOption(productId, parsed.data);
    return Response.json({ option }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
