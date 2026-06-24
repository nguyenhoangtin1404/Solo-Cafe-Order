import { handleRouteError } from "@/lib/errors";
import * as authService from "@/lib/services/auth.service";
import { NextResponse } from "next/server";

export async function POST(): Promise<Response> {
  try {
    await authService.signOut();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
