import { type NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import {
  getAdminCategories,
  createCategory,
} from "@/lib/services/category.service";
import { createCategorySchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireOwner();
    const categories = await getAdminCategories();
    return Response.json({ categories });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireOwner();

    const body = await req.json().catch(() => null);
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const category = await createCategory(
      parsed.data.name,
      parsed.data.sort_order
    );
    return Response.json({ category }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
