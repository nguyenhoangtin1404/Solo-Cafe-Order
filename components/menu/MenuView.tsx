"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CategoryTabs } from "./CategoryTabs";
import { MenuCard } from "./MenuCard";
import { ProductModal } from "./ProductModal";
import type { MenuCategory, MenuProduct } from "@/types/menu";

interface Props {
  categories: MenuCategory[];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng! ☀️";
  if (h < 18) return "Chào buổi chiều! ☕";
  return "Chào buổi tối! 🌙";
}

function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function MenuView({ categories }: Props) {
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cart = useCart();

  const cartCountMap = useMemo(
    () =>
      cart.items.reduce<Record<string, number>>((acc, i) => {
        acc[i.productId] = (acc[i.productId] ?? 0) + i.quantity;
        return acc;
      }, {}),
    [cart.items]
  );

  const totalQty = useMemo(
    () => Object.values(cartCountMap).reduce((s, v) => s + v, 0),
    [cartCountMap]
  );

  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0;

  const filteredCategories = useMemo(() => {
    if (!trimmedSearch) return categories;
    const q = normalizeSearch(trimmedSearch);
    return categories
      .map((cat) => ({
        ...cat,
        products: cat.products.filter((p) =>
          normalizeSearch(p.name).includes(q)
        ),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [categories, trimmedSearch]);

  return (
    <>
      <header className="px-4 pb-3 pt-4">
        <h1 className="text-xl font-bold">Vibe Cafe ☕</h1>
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {getGreeting()} Bạn muốn uống gì hôm nay?
        </p>
      </header>

      {/* Search bar */}
      <div role="search" className="px-4 pb-2">
        <div className="relative flex items-center">
          <Search
            size={16}
            className="absolute left-3 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            aria-label="Tìm kiếm món"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setSearch("");
                inputRef.current?.blur();
              }
            }}
            placeholder="Tìm cà phê, trà, bánh..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                inputRef.current?.blur();
              }}
              className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-r-xl"
              aria-label="Xóa tìm kiếm"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30">
                <X size={12} />
              </span>
            </button>
          )}
        </div>
      </div>

      {!isSearching && <CategoryTabs categories={categories} />}

      <main className="flex-1 space-y-6 px-4 pb-28 pt-4">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            {isSearching ? (
              <>
                <span className="text-4xl">🔍</span>
                <p className="font-medium">Không tìm thấy món nào</p>
                <p className="text-sm text-muted-foreground">
                  Thử tìm với từ khóa khác
                </p>
              </>
            ) : (
              <>
                <span className="text-4xl">☕</span>
                <p className="font-medium">Chưa có món nào</p>
              </>
            )}
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} id={`section-${cat.id}`}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.name}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {cat.products.map((product) => (
                  <MenuCard
                    key={product.id}
                    product={product}
                    cartCount={cartCountMap[product.id] ?? 0}
                    onClick={() => setSelected(product)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
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
          onAdd={cart.addItem}
        />
      )}
    </>
  );
}
