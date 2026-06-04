"use client";

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col items-center justify-center px-4 text-center font-sans">
        <p className="text-lg font-semibold text-gray-800">
          Có lỗi nghiêm trọng xảy ra
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Ứng dụng gặp sự cố. Vui lòng thử lại.
        </p>
        <button
          onClick={reset}
          className="mt-6 px-6 py-3 bg-black text-white rounded-full text-sm font-medium min-h-[44px]"
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
