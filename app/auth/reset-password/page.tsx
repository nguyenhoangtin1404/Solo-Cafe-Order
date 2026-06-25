"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = supabaseRef.current;

    // PASSWORD_RECOVERY fires when arriving from a Supabase reset email.
    // resetPasswordForEmail must use redirectTo with ?next=/auth/reset-password.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Handle navigation to this page when the session cookie is already set
    // (e.g., page refresh after recovery exchange).
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login?error=session_expired");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabaseRef.current.auth.updateUser({
      password,
    });
    if (updateError) {
      setError("Không thể cập nhật mật khẩu. Vui lòng thử lại.");
      setLoading(false);
      return;
    }
    setLoading(false);
    router.replace("/dashboard");
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Đang xác thực...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Đặt mật khẩu mới
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-border p-6 space-y-4"
        >
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-xs font-semibold tracking-widest text-secondary uppercase"
            >
              Mật khẩu mới
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
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
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
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>
    </main>
  );
}
