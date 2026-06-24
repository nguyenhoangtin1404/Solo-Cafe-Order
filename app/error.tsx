"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const msg = error.message.toLowerCase();
  const isNetworkError =
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("networkerror");

  const Icon = isNetworkError ? WifiOff : AlertCircle;
  const title = isNetworkError ? "Không có kết nối mạng" : "Có lỗi xảy ra";
  const subtitle = isNetworkError
    ? "Kiểm tra kết nối và thử lại."
    : "Vui lòng thử lại sau.";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6" aria-hidden="true">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-card">
          <Icon size={56} className="text-amber-400" />
        </div>
        <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow">
          ×
        </span>
      </div>

      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

      <button
        onClick={reset}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-white min-h-[44px] shadow"
      >
        <RefreshCw size={16} aria-hidden="true" />
        Thử lại
      </button>
    </main>
  );
}
