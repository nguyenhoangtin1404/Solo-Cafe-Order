"use client";

import { useState } from "react";
import { Coffee, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 1500));
    setError("Email hoặc mật khẩu không đúng");
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-cafe-600 to-cafe-800">
      {/* Branding */}
      <div className="flex flex-col items-center justify-center flex-1 px-8 pt-16 pb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 mb-4 shadow-xl">
          <Coffee className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white">Solo Cafe</h1>
        <p className="text-cafe-200 mt-1 text-sm">Quản lý quán của bạn</p>
      </div>

      {/* Login card */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Đăng nhập</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="owner@solucafe.vn"
                required
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3.5 text-sm focus:border-cafe-500 focus:outline-none focus:ring-2 focus:ring-cafe-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-gray-200 pl-10 pr-12 py-3.5 text-sm focus:border-cafe-500 focus:outline-none focus:ring-2 focus:ring-cafe-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-cafe-600 py-4 font-bold text-white shadow-sm disabled:opacity-70 active:scale-95 transition-transform mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Đang đăng nhập...
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
