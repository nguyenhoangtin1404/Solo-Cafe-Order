import { CheckCircle, Clock, ArrowRight, Coffee } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

const MOCK_ORDER = {
  order_code: "A001",
  pickup_name: "Minh",
  total_amount: 120000,
  wait_estimate: "10-15 phút",
  items: [
    {
      product_name: "Cà Phê Sữa Đá",
      quantity: 2,
      unit_price: 40000,
      selected_options: [{ option_name: "Size", value_name: "L", extra_price: 5000 }],
    },
    {
      product_name: "Trà Sữa Truyền Thống",
      quantity: 1,
      unit_price: 40000,
      selected_options: [],
    },
  ],
};

export default function OrderSuccessPage() {
  return (
    <div className="flex flex-col min-h-screen bg-cafe-50">
      {/* Success banner */}
      <div className="bg-gradient-to-b from-cafe-600 to-cafe-500 px-6 pt-12 pb-10 text-white text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-1">Đặt hàng thành công!</h1>
        {MOCK_ORDER.pickup_name && (
          <p className="text-cafe-100">Cảm ơn {MOCK_ORDER.pickup_name} đã đặt hàng</p>
        )}

        {/* Order code */}
        <div className="mt-6 inline-flex flex-col items-center bg-white/15 rounded-2xl px-8 py-4">
          <p className="text-cafe-100 text-sm">Mã đơn hàng</p>
          <p className="text-4xl font-black tracking-wider mt-1">{MOCK_ORDER.order_code}</p>
        </div>
      </div>

      <main className="flex-1 p-4 space-y-4 -mt-2">
        {/* Wait estimate card */}
        <div className="rounded-2xl bg-white shadow-sm border border-cafe-100 p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 shrink-0">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Thời gian chờ dự kiến</p>
            <p className="text-xl font-bold text-gray-900">{MOCK_ORDER.wait_estimate}</p>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-white shadow-sm border border-cafe-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Coffee className="h-4 w-4 text-cafe-500" />
            Đơn hàng của bạn
          </h2>
          {MOCK_ORDER.items.map((item, i) => (
            <div key={i} className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{item.product_name}</p>
                {item.selected_options.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {item.selected_options.map(o => `${o.option_name}: ${o.value_name}`).join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-sm text-gray-500">× {item.quantity}</p>
                <p className="font-semibold text-cafe-700">{formatPrice(item.unit_price * item.quantity)}</p>
              </div>
            </div>
          ))}
          <div className="border-t border-cafe-100 pt-3 flex justify-between font-bold">
            <span>Tổng cộng</span>
            <span className="text-cafe-700">{formatPrice(MOCK_ORDER.total_amount)}</span>
          </div>
        </div>

        {/* CTA buttons */}
        <Link
          href={`/order/${MOCK_ORDER.order_code}`}
          className="w-full flex items-center justify-between rounded-2xl bg-cafe-600 px-5 py-4 text-white font-semibold shadow-sm active:scale-95 transition-transform"
        >
          <span>Theo dõi đơn hàng</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          href="/menu"
          className="w-full flex items-center justify-center rounded-2xl border border-cafe-200 bg-white px-5 py-4 text-cafe-700 font-semibold active:scale-95 transition-transform"
        >
          Quay về menu
        </Link>
      </main>
    </div>
  );
}
