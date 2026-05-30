"use client";

import { useState } from "react";
import { ArrowLeft, X, CheckCircle, Clock, Coffee, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "new" | "making" | "done" | "cancelled";

const MOCK_ORDER = {
  order_code: "A001",
  status: "making" as OrderStatus,
  pickup_name: "Minh",
  total_amount: 120000,
  created_at: new Date().toISOString(),
  items: [
    {
      product_name: "Cà Phê Sữa Đá",
      quantity: 2,
      unit_price: 40000,
      selected_options: [{ option_name: "Size", value_name: "L", extra_price: 5000 }],
      note: "Ít đường",
    },
    {
      product_name: "Trà Sữa Truyền Thống",
      quantity: 1,
      unit_price: 40000,
      selected_options: [],
      note: "",
    },
  ],
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ElementType; bg: string }
> = {
  new: { label: "Chờ xác nhận", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  making: { label: "Đang pha chế", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Coffee },
  done: { label: "Sẵn sàng lấy!", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle },
  cancelled: { label: "Đã huỷ", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: XCircle },
};

const STEPS = [
  { key: "new", label: "Đã đặt" },
  { key: "making", label: "Đang pha" },
  { key: "done", label: "Xong rồi!" },
] as const;

export default function OrderTrackingPage({ params }: { params: { code: string } }) {
  const [order, setOrder] = useState({ ...MOCK_ORDER, order_code: params.code });
  const [cancelling, setCancelling] = useState(false);

  const config = STATUS_CONFIG[order.status];
  const StatusIcon = config.icon;
  const stepIndex = order.status === "cancelled" ? -1 : STEPS.findIndex(s => s.key === order.status);

  async function handleCancel() {
    setCancelling(true);
    await new Promise(r => setTimeout(r, 1000));
    setOrder(prev => ({ ...prev, status: "cancelled" }));
    setCancelling(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-cafe-50">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-cafe-100 bg-white sticky top-0 z-10">
        <Link
          href="/menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="font-bold text-gray-900">Đơn #{order.order_code}</h1>
          <p className="text-xs text-gray-500">Cập nhật realtime</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-600">Live</span>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Status card */}
        <div className={`rounded-2xl border ${config.bg} p-5 flex items-center gap-4`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm shrink-0">
            <StatusIcon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Trạng thái</p>
            <p className={`text-xl font-bold ${config.color}`}>{config.label}</p>
          </div>
        </div>

        {/* Progress steps */}
        {order.status !== "cancelled" && (
          <div className="rounded-2xl bg-white shadow-sm border border-cafe-100 p-5">
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute left-6 right-6 top-5 h-0.5 bg-cafe-100">
                <div
                  className="h-full bg-cafe-500 transition-all duration-700"
                  style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      i <= stepIndex
                        ? "border-cafe-500 bg-cafe-500 text-white"
                        : "border-cafe-200 bg-white text-gray-400"
                    }`}
                  >
                    {i < stepIndex ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : i === stepIndex ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <p className={`text-xs font-medium ${i <= stepIndex ? "text-cafe-700" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl bg-white shadow-sm border border-cafe-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Danh sách đồ uống</h2>
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-start pb-3 last:pb-0 border-b last:border-0 border-cafe-50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{item.product_name}</p>
                {item.selected_options.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {item.selected_options.map(o => o.value_name).join(", ")}
                  </p>
                )}
                {item.note && <p className="text-xs italic text-cafe-600">{item.note}</p>}
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-sm text-gray-500">× {item.quantity}</p>
                <p className="font-semibold text-cafe-700">{formatPrice(item.unit_price * item.quantity)}</p>
              </div>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-1">
            <span>Tổng cộng</span>
            <span className="text-cafe-700">{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        {/* Cancel button — only visible when status = new */}
        {order.status === "new" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-red-600 font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            {cancelling ? "Đang huỷ..." : "Huỷ đơn hàng"}
          </button>
        )}
      </main>
    </div>
  );
}
