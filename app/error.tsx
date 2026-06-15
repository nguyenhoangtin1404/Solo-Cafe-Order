"use client";

import { useEffect } from "react";

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
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-lg font-semibold text-gray-800">Có lỗi xảy ra</p>
      <p className="mt-1 text-sm text-gray-500">Vui lòng thử lại.</p>
      <button
        onClick={reset}
        className="mt-6 px-6 py-3 bg-black text-white rounded-full text-sm font-medium min-h-[44px]"
      >
        Thử lại
      </button>
    </main>
  );
}
