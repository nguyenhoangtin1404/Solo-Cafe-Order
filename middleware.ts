import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Validate ?next= param trước khi redirect sau login.
 * GỌI HÀM NÀY Ở LOGIN PAGE khi đọc searchParams.get("next") — không chỉ ở đây.
 * Chặn open redirect: chỉ accept internal path bắt đầu bằng "/" và không phải "//".
 */
export function isSafeRedirect(value: string | null | undefined): value is string {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//");
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

  // getUser() refresh session cookie nếu cần — phải gọi trước bất kỳ redirect nào
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Unauthenticated: redirect về /login với ?next= để sau login quay lại đúng trang
  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) &&
    !user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (isSafeRedirect(pathname)) {
      url.searchParams.set("next", pathname);
    }
    supabaseResponse.headers.set("Location", url.toString());
    return new NextResponse(null, {
      status: 307,
      headers: supabaseResponse.headers,
    });
  }

  // Authenticated nhưng không có role admin: chặn /admin
  // user_metadata.role được set bởi service role khi tạo tài khoản admin
  if (pathname.startsWith("/admin") && user) {
    const role = user.user_metadata?.role as string | undefined;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      supabaseResponse.headers.set("Location", url.toString());
      return new NextResponse(null, {
        status: 307,
        headers: supabaseResponse.headers,
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  // Chạy middleware trên tất cả routes (trừ static files) để session luôn được refresh
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
