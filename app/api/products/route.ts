import { type NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { createProductSchema } from "@/lib/validators";
import {
  getAdminProducts,
  createProduct,
} from "@/lib/services/product.service";

export async function GET() {
  try {
    await requireOwner();
    const products = await getAdminProducts();
    return Response.json({ products });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireOwner();

    const body = await req.json().catch(() => null);
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.",
        400
      );
    }

    const product = await createProduct(parsed.data);
    return Response.json({ product }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
