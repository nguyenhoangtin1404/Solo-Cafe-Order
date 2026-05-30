"use client";

import { useState } from "react";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const MOCK_CART_ITEMS = [
  {
    id: "1",
    product_name: "Cà Phê Sữa Đá",
    quantity: 2,
    unit_price: 40000,
    note: "Ít đường",
    selected_options: [{ option_name: "Size", value_name: "L", extra_price: 5000 }],
  },
  {
    id: "2",
    product_name: "Trà Sữa Truyền Thống",
    quantity: 1,
    unit_price: 40000,
    note: "",
    selected_options: [],
  },
];

export default function CartPage() {
  const [items, setItems] = useState(MOCK_CART_ITEMS);
  const [pickupName, setPickupName] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  function updateQty(id: string, delta: number) {
    setItems(prev =>
      prev
        .map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
        .filter(item => item.quantity > 0)
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center gap-3 px-4 py-4 border-b border-cafe-100">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-50">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900 text-lg">Giỏ hàng</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <ShoppingBag className="h-16 w-16 text-cafe-200" />
          <p className="text-gray-500 text-center">Giỏ hàng trống. Quay lại menu để chọn món!</p>
          <button className="rounded-xl bg-cafe-500 px-6 py-3 font-semibold text-white">
            Xem menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-cafe-100 bg-white sticky top-0 z-10">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-50">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Giỏ hàng</h1>
        <span className="ml-auto text-sm text-gray-500">{items.length} món</span>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-40">
        {/* Cart items */}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-white border border-cafe-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{item.product_name}</p>
                {item.selected_options.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.selected_options.map(o => `${o.option_name}: ${o.value_name}`).join(", ")}
                  </p>
                )}
                {item.note && (
                  <p className="text-xs text-cafe-600 mt-0.5 italic">&ldquo;{item.note}&rdquo;</p>
                )}
              </div>
              <button
                onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-cafe-200 text-cafe-600"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-cafe-500 text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="font-bold text-cafe-700">{formatPrice(item.unit_price * item.quantity)}</p>
            </div>
          </div>
        ))}

        {/* Order form */}
        <div className="rounded-xl bg-white border border-cafe-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Thông tin đặt hàng</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Tên để gọi (tùy chọn)</label>
            <input
              type="text"
              value={pickupName}
              onChange={e => setPickupName(e.target.value)}
              placeholder="VD: Minh, Lan..."
              maxLength={50}
              className="w-full rounded-xl border border-cafe-200 px-4 py-3 text-sm focus:border-cafe-500 focus:outline-none focus:ring-2 focus:ring-cafe-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Ghi chú cho quán (tùy chọn)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="VD: Ít đá, ít đường, không đá..."
              maxLength={200}
              rows={3}
              className="w-full rounded-xl border border-cafe-200 px-4 py-3 text-sm focus:border-cafe-500 focus:outline-none focus:ring-2 focus:ring-cafe-200 resize-none"
            />
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-xl bg-cafe-50 border border-cafe-100 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">Tóm tắt đơn</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-gray-700">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{formatPrice(item.unit_price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-cafe-200 pt-2 flex justify-between font-bold text-gray-900">
            <span>Tổng cộng</span>
            <span className="text-cafe-700">{formatPrice(total)}</span>
          </div>
        </div>
      </main>

      {/* Submit button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-cafe-100 p-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-cafe-600 py-4 font-bold text-white shadow-lg disabled:opacity-70 transition-opacity active:scale-95 tap-highlight-none"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Đang gửi đơn...
            </span>
          ) : (
            `Đặt hàng · ${formatPrice(total)}`
          )}
        </button>
      </div>
    </div>
  );
}
