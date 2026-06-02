import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isSafeRedirect(pathname: string): boolean {
  // Chỉ cho phép redirect về internal path, chặn open redirect
  return pathname.startsWith("/") && !pathname.startsWith("//");
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Gọi getUser() để middleware refresh session cookie nếu cần
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.pathname;
    url.pathname = "/login";
    // Chỉ set ?next= nếu pathname là internal path (chặn open redirect)
    if (isSafeRedirect(next)) {
      url.searchParams.set("next", next);
    }
    // Trả về supabaseResponse với Location header thay vì tạo redirectResponse mới
    // để giữ nguyên cookie attributes từ session refresh
    supabaseResponse.headers.set("Location", url.toString());
    return new NextResponse(null, {
      status: 307,
      headers: supabaseResponse.headers,
    });
  }

  return supabaseResponse;
}

export const config = {
  // Chạy middleware trên tất cả routes (trừ static files) để session luôn được refresh
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
