import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    .forEach((c) => redirectResponse.cookies.set(c.name, c.value, c));
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  if (!isProtectedPath) {
    return NextResponse.next({ request });
  }

  // Cannot import from lib/supabase/server.ts — that file uses next/headers (Node.js only).
  // Middleware runs on Edge Runtime so the client must be initialized inline.
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
  if (pathname.startsWith("/admin")) {
    const role = user.app_metadata?.role as string | undefined;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return makeRedirect(url, supabaseResponse);
    }
  }
  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
