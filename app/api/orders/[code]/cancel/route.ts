import { type NextRequest } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { cancelOrder } from "@/lib/services/order.service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const order = await cancelOrder(code, "customer");
    return Response.json({ order_code: order.order_code, status: order.status });
  } catch (err) {
    return handleRouteError(err);
  }
}
