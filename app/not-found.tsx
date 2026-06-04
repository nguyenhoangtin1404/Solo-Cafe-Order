import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-gray-100">404</p>
      <p className="mt-4 text-lg font-semibold text-gray-800">
        Trang không tồn tại
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Địa chỉ này không còn hoặc chưa bao giờ tồn tại.
      </p>
      <Link
        href="/menu"
        className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-full text-sm font-medium min-h-[44px]"
      >
        Về menu
      </Link>
    </main>
  );
}
