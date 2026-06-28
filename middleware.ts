import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
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
    .forEach(({ name, value, ...options }) =>
      redirectResponse.cookies.set(name, value, options)
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Per-request nonce for script-src CSP — prevents unsafe-inline while
  // allowing Next.js's own generated inline scripts (Next.js reads x-nonce
  // from request headers and applies the nonce to its own <script> tags).
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16))
  ).toString("base64");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // Cannot import from lib/supabase/server.ts — that file uses next/headers (Node.js only).
  // Middleware runs on Edge Runtime so the client must be initialized inline.
  // getUser() must be called on every matched request so expiring JWTs are
  // refreshed and the Set-Cookie header is forwarded to the browser.
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

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
          // Preserve requestHeaders (including x-nonce) when Supabase refreshes cookies.
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
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

  // Apply nonce-based CSP to all HTML responses.
  const supabaseHostname = new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL"))
    .hostname;
  supabaseResponse.headers.set(
    "Content-Security-Policy",
    buildCsp(nonce, supabaseHostname)
  );

  // Only redirect to /login for owner-protected routes; public routes pass through.
  const isProtected = OWNER_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (!user && isProtected) {
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
      typeof user?.app_metadata?.role === "string"
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
  // Runs on all HTML routes for JWT refresh and nonce-based CSP.
  // Excludes API routes (they have their own auth), static assets, and image optimizer.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)).*)",
  ],
};
