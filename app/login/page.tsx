"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email hoặc mật khẩu không đúng");
      setLoading(false);
      return;
    }

    const next = searchParams.get("next");
    const isOwnerRoute = (p: string) =>
      p === "/dashboard" ||
      p.startsWith("/dashboard/") ||
      p === "/admin" ||
      p.startsWith("/admin/");
    const target = next && isOwnerRoute(next) ? next : "/dashboard";
    router.push(target);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-4"
    >
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-background"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-background"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">☕ Vibe Cafe</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Đăng nhập để quản lý quán
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
