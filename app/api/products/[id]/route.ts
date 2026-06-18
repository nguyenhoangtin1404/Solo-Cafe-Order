import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { updateProductSchema } from "@/lib/validators";
import {
  deleteProduct,
  getProductWithOptions,
  updateProduct,
} from "@/lib/services/product.service";

type Params = { params: Promise<{ id: string }> };

async function resolveId(params: Params["params"]): Promise<string | null> {
  const { id } = await params;
  return z.string().uuid().safeParse(id).success ? id : null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const id = await resolveId(params);
    if (!id) {
      return errorResponse(
        "VALIDATION_ERROR",
        "ID sản phẩm không hợp lệ.",
        400
      );
    }

    const product = await getProductWithOptions(id);
    if (!product) {
      return errorResponse("PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại.", 404);
    }

    return Response.json({ product });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const id = await resolveId(params);
    if (!id) {
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
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const product = await updateProduct(id, parsed.data);
    return Response.json({ product });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const id = await resolveId(params);
    if (!id) {
      return errorResponse(
        "VALIDATION_ERROR",
        "ID sản phẩm không hợp lệ.",
        400
      );
    }

    await deleteProduct(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
