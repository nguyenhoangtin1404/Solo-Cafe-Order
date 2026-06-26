import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ONLY_PATH_PREFIXES } from "@/lib/constants";

export function isSafeRedirect(
  value: string | null | undefined
): value is string {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//");
}

function requireEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function makeRedirect(url: URL, supabaseResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies
    .getAll()
    .forEach(({ name, value, ...options }) =>
      redirectResponse.cookies.set(name, value, options)
    );
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Cannot import from lib/supabase/server.ts — that file uses next/headers (Node.js only).
  // Middleware runs on Edge Runtime so the client must be initialized inline.
  // getUser() must be called on every matched request so expiring JWTs are
  // refreshed and the Set-Cookie header is forwarded to the browser.
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cs: { name: string; value: string; options: CookieOptions }[]) {
          cs.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cs.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (isSafeRedirect(pathname)) url.searchParams.set("next", pathname);
    return makeRedirect(url, supabaseResponse);
  }

  // /admin and /reports require the admin role in addition to authentication.
  // The role check here mirrors requireOwner() in server pages — both layers
  // must agree so a future page under /reports can't skip the guard.
  const requiresAdmin = ADMIN_ONLY_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (requiresAdmin) {
    const role =
      typeof user.app_metadata?.role === "string"
        ? user.app_metadata.role
        : undefined;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return makeRedirect(url, supabaseResponse);
    }
  }

  return supabaseResponse;
}

export const config = {
  // NOTE: Public routes (/menu, /cart, /order/*) are intentionally excluded.
  // Supabase recommends running middleware on ALL routes for JWT refresh, but
  // a broader matcher requires more testing — deferred to Phase 2.
  // The bare /reports path is listed explicitly alongside /reports/:path* for clarity.
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/reports",
    "/reports/:path*",
  ],
};
