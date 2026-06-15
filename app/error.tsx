"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <span className="text-4xl">⚠️</span>
      <p className="text-lg font-semibold">Có lỗi xảy ra</p>
      <p className="text-sm text-muted-foreground">
        Vui lòng kiểm tra kết nối và thử lại.
      </p>
      <button
        onClick={reset}
        className="mt-4 min-h-[44px] rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Thử lại
      </button>
    </main>
  );
}
