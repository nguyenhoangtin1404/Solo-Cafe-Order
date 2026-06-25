"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Leaf, Search, ShoppingCart, X } from "lucide-react";
import { normalizeSearch } from "@/lib/utils";
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

function EmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {isSearching ? (
        <>
          <span className="text-4xl">🔍</span>
          <div>
            <p className="font-medium">Không tìm thấy món nào</p>
            <p className="text-sm text-muted-foreground">
              Thử tìm với từ khóa khác
            </p>
          </div>
        </>
      ) : (
        <>
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full bg-card"
            aria-hidden="true"
          >
            <Leaf size={48} className="text-amber-400" />
          </div>
          <div>
            <p className="font-bold">Danh mục này chưa có món</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vui lòng chọn danh mục khác
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function CartBar({ totalQty, total }: { totalQty: number; total: number }) {
  if (totalQty === 0) return null;
  return (
    <div
      className="fixed left-4 right-4 z-20"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
    >
      <Link
        href="/cart"
        className="flex items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} />
          <span className="font-medium">{totalQty} món</span>
        </div>
        <span className="font-semibold">{total.toLocaleString("vi-VN")}đ</span>
      </Link>
    </div>
  );
}

export function MenuView({ categories }: Props) {
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [search, setSearch] = useState("");
  const [greeting] = useState(getGreeting);
  const inputRef = useRef<HTMLInputElement>(null);
  const cart = useCart();

  const { cartCountMap, totalQty } = useMemo(
    () =>
      cart.items.reduce<{
        cartCountMap: Record<string, number>;
        totalQty: number;
      }>(
        (acc, i) => {
          acc.cartCountMap[i.productId] =
            (acc.cartCountMap[i.productId] ?? 0) + i.quantity;
          acc.totalQty += i.quantity;
          return acc;
        },
        { cartCountMap: {}, totalQty: 0 }
      ),
    [cart.items]
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

  const clearSearch = () => {
    setSearch("");
    inputRef.current?.blur();
  };

  return (
    <>
      <header className="px-4 pb-3 pt-4">
        <h1 className="text-xl font-bold">Vibe Cafe ☕</h1>
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {greeting} Bạn muốn uống gì hôm nay?
        </p>
      </header>

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
            inputMode="search"
            aria-label="Tìm kiếm món"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                clearSearch();
              } else if (e.key === "Enter") {
                inputRef.current?.blur();
              }
            }}
            placeholder="Tìm cà phê, trà, bánh..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-11 text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
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

      <main
        className="flex-1 space-y-6 px-4 pt-4"
        style={{
          paddingBottom:
            totalQty > 0
              ? "calc(9rem + env(safe-area-inset-bottom, 0px))"
              : "calc(5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {filteredCategories.length === 0 ? (
          <EmptyState isSearching={isSearching} />
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

      <CartBar totalQty={totalQty} total={cart.total} />

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
