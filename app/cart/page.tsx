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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShoppingCart size={48} className="text-muted-foreground" />
        <p className="text-lg font-medium">Giỏ hàng trống</p>
        <Link
          href="/menu"
          className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Xem menu
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
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
