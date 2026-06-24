import Link from "next/link";
import { ArrowRight, Coffee } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#fff1e3]">
          <Coffee size={56} className="text-amber-500" />
        </div>
        <span className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white shadow">
          404
        </span>
      </div>

      <h1 className="text-xl font-bold text-foreground">
        Oops! Trang không tồn tại
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        URL này không đúng hoặc đơn hàng không tìm thấy.
      </p>

      <Link
        href="/menu"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-white min-h-[44px] shadow"
      >
        Về trang menu
        <ArrowRight size={16} />
      </Link>

      {/* Decorative icons */}
      <div className="mt-8 flex gap-4 text-amber-300">
        <Coffee size={20} />
        <Coffee size={20} />
        <Coffee size={20} />
      </div>
    </main>
  );
}
