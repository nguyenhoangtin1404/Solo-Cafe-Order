import { type NextRequest } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { requireOwner } from "@/lib/auth/requireOwner";
import { getRevenueByCategory } from "@/lib/services/report.service";

export async function GET(req: NextRequest) {
  try {
    await requireOwner();

    const { searchParams } = req.nextUrl;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return errorResponse("VALIDATION_ERROR", "from và to là bắt buộc", 400);
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return errorResponse(
        "VALIDATION_ERROR",
        "from hoặc to không hợp lệ",
        400
      );
    }

    if (from > to) {
      return errorResponse(
        "VALIDATION_ERROR",
        "from phải nhỏ hơn hoặc bằng to",
        400
      );
    }

    const categories = await getRevenueByCategory(from, to);
    return Response.json({ categories });
  } catch (err) {
    return handleRouteError(err);
  }
}
