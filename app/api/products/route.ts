import { requireOwner } from "@/lib/auth/requireOwner";
import { handleRouteError } from "@/lib/errors";
import { getAdminProducts } from "@/lib/services/product.service";

export async function GET() {
  try {
    await requireOwner();
    const products = await getAdminProducts();
    return Response.json({ products });
  } catch (err) {
    return handleRouteError(err);
  }
}
