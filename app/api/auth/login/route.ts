import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { loginSchema } from "@/lib/validators";
import { checkLoginRateLimit, getClientIp } from "@/lib/ratelimit";
import * as authService from "@/lib/services/auth.service";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterSeconds } = await checkLoginRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          message: "Quá nhiều lần thử. Vui lòng thử lại sau ít phút.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ." },
        { status: 400 }
      );
    }

    await authService.signIn(parsed.data.email, parsed.data.password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
