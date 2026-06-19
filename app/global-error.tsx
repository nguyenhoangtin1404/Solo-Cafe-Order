"use client";

import { Be_Vietnam_Pro } from "next/font/google";
import { useEffect } from "react";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export default function GlobalError({
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
    <html lang="vi" className={`${beVietnamPro.variable} antialiased`}>
      <body className="min-h-screen flex flex-col items-center justify-center px-4 text-center font-sans">
        <p className="text-lg font-semibold text-foreground">
          Có lỗi nghiêm trọng xảy ra
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ứng dụng gặp sự cố. Vui lòng thử lại.
        </p>
        <button
          onClick={reset}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium min-h-[44px]"
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
