"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const isRateLimit =
          authError.code?.includes("rate_limit") || authError.status === 429;
        setError(
          isRateLimit
            ? "Quá nhiều lần thử. Vui lòng thử lại sau ít phút."
            : "Email hoặc mật khẩu không đúng"
        );
        return;
      }

      setPassword("");
      const next = searchParams.get("next");
      const isSafeRelative = (p: string) =>
        p.startsWith("/") && !p.startsWith("//");
      const isOwnerRoute = (p: string) =>
        p === "/dashboard" ||
        p.startsWith("/dashboard/") ||
        p === "/admin" ||
        p.startsWith("/admin/");
      const target =
        next && isSafeRelative(next) && isOwnerRoute(next)
          ? next
          : "/dashboard";
      window.location.href = target;
    } catch {
      // unexpected error (network, SDK init failure, etc.)
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-border p-6 space-y-4"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Đăng nhập</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chào mừng bạn quay trở lại!
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-xs font-semibold tracking-widest text-secondary uppercase"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            id="email"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            placeholder="owner@cafe.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className="w-full pl-9 pr-3 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-background"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-xs font-semibold tracking-widest text-secondary uppercase"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className="w-full pl-9 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-background"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            tabIndex={-1}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
      >
        {loading ? (
          "Đang đăng nhập..."
        ) : (
          <>
            Đăng nhập <span aria-hidden="true">→</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <Image
              src="/logo_bean.png"
              alt="Vibe Cafe logo"
              width={56}
              height={56}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-secondary">Vibe Cafe ☕</h1>
        </div>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-white p-6 h-[350px] animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
