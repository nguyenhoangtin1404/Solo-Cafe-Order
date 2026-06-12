"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CategoryTabs } from "./CategoryTabs";
import { MenuCard } from "./MenuCard";
import { ProductModal } from "./ProductModal";
import type { MenuCategory, MenuProduct } from "@/types/menu";

interface Props {
  categories: MenuCategory[];
}

export function MenuView({ categories }: Props) {
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const cart = useCart();

  const cartCountForProduct = (productId: string) =>
    cart.items.reduce(
      (sum, i) => (i.productId === productId ? sum + i.quantity : sum),
      0
    );

  const totalQty = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <header className="border-b px-4 py-4">
        <h1 className="text-xl font-bold">Vibe Cafe ☕</h1>
        <p className="text-sm text-muted-foreground">Chọn đồ uống yêu thích</p>
      </header>

      <CategoryTabs categories={categories} />

      <main className="flex-1 space-y-6 px-4 pb-28 pt-4">
        {categories.map((cat) => (
          <section key={cat.id} id={`section-${cat.id}`}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {cat.name}
            </h2>
            <div className="space-y-2">
              {cat.products.map((product) => (
                <MenuCard
                  key={product.id}
                  product={product}
                  cartCount={cartCountForProduct(product.id)}
                  onClick={() => setSelected(product)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {totalQty > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <Link
            href="/cart"
            className="flex items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span className="font-medium">{totalQty} món</span>
            </div>
            <span className="font-semibold">
              {cart.total.toLocaleString("vi-VN")}đ
            </span>
          </Link>
        </div>
      )}

      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onAdd={(item) => cart.addItem(item)}
        />
      )}
    </>
  );
}
