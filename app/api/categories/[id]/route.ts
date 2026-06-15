import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import {
  updateCategory,
  deleteCategory,
} from "@/lib/services/category.service";
import { updateCategorySchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

async function resolveId(params: Params["params"]): Promise<string | null> {
  const { id } = await params;
  return z.string().uuid().safeParse(id).success ? id : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireOwner();

    const id = await resolveId(params);
    if (!id) {
      return errorResponse(
        "VALIDATION_ERROR",
        "ID danh mục không hợp lệ.",
        400
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const category = await updateCategory(id, parsed.data);
    return Response.json({ category });
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
        "ID danh mục không hợp lệ.",
        400
      );
    }

    await deleteCategory(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
