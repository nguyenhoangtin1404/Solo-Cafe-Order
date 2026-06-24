"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
        style={{
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#fff1e3]">
          <ShoppingCart size={64} className="text-amber-400" />
        </div>
        <div>
          <p className="text-lg font-bold">Giỏ hàng đang trống</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Hãy chọn món bạn thích!
          </p>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-white min-h-[44px] shadow"
        >
          <ArrowLeft size={16} />
          Xem menu
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          href="/menu"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-semibold">
          Giỏ hàng ({cart.items.reduce((s, i) => s + i.quantity, 0)} món)
        </h1>
      </header>

      <div className="flex-1 space-y-3 px-4 py-4">
        {cart.items.map((item, idx) => (
          <CartItem
            key={`${item.productId}:${[...item.selectedOptions]
              .sort((a, b) => a.valueId.localeCompare(b.valueId))
              .map((o) => o.valueId)
              .join(",")}:${item.note ?? ""}`}
            item={item}
            index={idx}
            onUpdateQty={cart.updateQuantity}
            onRemove={cart.removeItem}
          />
        ))}
      </div>

      <CartSummary
        items={cart.items}
        total={cart.total}
        onClearCart={cart.clear}
      />
    </div>
  );
}
