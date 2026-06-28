import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ONLY_PATH_PREFIXES, OWNER_PATH_PREFIXES } from "@/lib/constants";

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
    .forEach(({ name, value, ...opts }) =>
      redirectResponse.cookies.set(name, value, opts)
    );
  // Copy response headers so CSP and other security headers survive redirects.
  supabaseResponse.headers.forEach((value, key) =>
    redirectResponse.headers.set(key, value)
  );
  return redirectResponse;
}

function buildCsp(nonce: string, supabaseHostname: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: https://${supabaseHostname}`,
    `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

// Returns a redirect response when auth rules are violated, null otherwise.
function resolveAuthRedirect(
  pathname: string,
  user: User | null,
  request: NextRequest,
  supabaseResponse: NextResponse
): NextResponse | null {
  const isProtected = OWNER_PATH_PREFIXES.some((p) => pathname.startsWith(p));
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (isSafeRedirect(pathname)) url.searchParams.set("next", pathname);
    return makeRedirect(url, supabaseResponse);
  }
  const requiresAdmin = ADMIN_ONLY_PATH_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  if (!requiresAdmin) return null;
  // user is guaranteed non-null here: admin paths ⊆ owner paths, so the
  // isProtected guard above already redirected unauthenticated requests.
  const role =
    typeof user?.app_metadata?.role === "string"
      ? user.app_metadata.role
      : undefined;
  if (role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return makeRedirect(url, supabaseResponse);
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Per-request nonce for script-src CSP (Next.js reads x-nonce from request headers).
  // Use btoa + String.fromCharCode — Buffer is Node-only and unavailable in Edge Runtime.
  const nonce = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  // Public routes: nonce + CSP only — skip Supabase JWT round-trip for customer traffic.
  if (!OWNER_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set(
      "Content-Security-Policy",
      buildCsp(nonce, new URL(supabaseUrl).hostname)
    );
    return response;
  }
  // Owner routes: full JWT check + refresh (cannot import from lib/supabase/server.ts —
  // that file uses next/headers which is Node.js only).
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  const isProd = process.env.NODE_ENV === "production";
  // Preserve x-nonce in requestHeaders when Supabase refreshes cookies mid-request.
  // Re-apply httpOnly/secure/sameSite so hardened flags survive token refreshes.
  const setAll = (
    cs: { name: string; value: string; options: CookieOptions }[]
  ) => {
    cs.forEach(({ name, value }) => request.cookies.set(name, value));
    supabaseResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    cs.forEach(({ name, value, options }) =>
      supabaseResponse.cookies.set(name, value, {
        ...options,
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
      })
    );
  };
  const supabase = createServerClient(
    supabaseUrl,
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { cookies: { getAll: () => request.cookies.getAll(), setAll } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  supabaseResponse.headers.set(
    "Content-Security-Policy",
    buildCsp(nonce, new URL(supabaseUrl).hostname)
  );
  const redirect = resolveAuthRedirect(
    pathname,
    user,
    request,
    supabaseResponse
  );
  if (redirect) return redirect;
  return supabaseResponse;
}

export const config = {
  // Runs on all HTML routes for JWT refresh and nonce-based CSP.
  // Excludes API routes (they have their own auth), static assets, and image optimizer.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)).*)",
  ],
};
