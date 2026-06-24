"use client";

import { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

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

  const isNetworkError =
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("fetch") ||
    error.message.toLowerCase().includes("failed");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#fff1e3]">
          <WifiOff size={56} className="text-amber-500" />
        </div>
        <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow">
          ×
        </span>
      </div>

      <h1 className="text-xl font-bold text-foreground">
        {isNetworkError ? "Không có kết nối mạng" : "Có lỗi xảy ra"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isNetworkError
          ? "Kiểm tra kết nối và thử lại."
          : "Vui lòng thử lại sau."}
      </p>

      <button
        onClick={reset}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-900 px-7 py-3 text-sm font-semibold text-white min-h-[44px] shadow"
      >
        <RefreshCw size={16} />
        Thử lại
      </button>
    </main>
  );
}
