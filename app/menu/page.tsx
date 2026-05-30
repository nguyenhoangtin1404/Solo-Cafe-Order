"use client";

import { useState } from "react";
import { ShoppingCart, Coffee, ChevronRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

const MOCK_CATEGORIES = [
  { id: "1", name: "Cà Phê", count: 6 },
  { id: "2", name: "Trà Sữa", count: 4 },
  { id: "3", name: "Nước Ép", count: 3 },
  { id: "4", name: "Bánh", count: 5 },
];

const MOCK_PRODUCTS = [
  { id: "1", name: "Cà Phê Sữa Đá", price: 35000, category_id: "1", description: "Đậm đà, thơm ngon", image_url: null, is_available: true },
  { id: "2", name: "Bạc Xỉu", price: 30000, category_id: "1", description: "Nhẹ nhàng, ngọt ngào", image_url: null, is_available: true },
  { id: "3", name: "Cà Phê Đen", price: 25000, category_id: "1", description: "Nguyên chất, đậm vị", image_url: null, is_available: true },
  { id: "4", name: "Cappuccino", price: 45000, category_id: "1", description: "Ý truyền thống", image_url: null, is_available: false },
  { id: "5", name: "Trà Sữa Truyền Thống", price: 40000, category_id: "2", description: "Trà oolong với sữa tươi", image_url: null, is_available: true },
  { id: "6", name: "Trà Sữa Matcha", price: 45000, category_id: "2", description: "Matcha Nhật thượng hạng", image_url: null, is_available: true },
];

type Product = typeof MOCK_PRODUCTS[0];

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      disabled={!product.is_available}
      className="flex w-full items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-cafe-100 text-left transition-all active:scale-95 disabled:opacity-50 tap-highlight-none"
    >
      {/* Product image placeholder */}
      <div className="relative h-20 w-20 shrink-0 rounded-lg bg-cafe-100 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Coffee className="h-8 w-8 text-cafe-300" />
        </div>
        {!product.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
            <span className="text-white text-xs font-medium">Hết hàng</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 truncate">{product.name}</p>
        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
        <p className="mt-1.5 font-bold text-cafe-600">{formatPrice(product.price)}</p>
      </div>
      <div className="shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cafe-500 text-white shadow-sm">
          <span className="text-lg leading-none mb-0.5">+</span>
        </div>
      </div>
    </button>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-cafe-100">
          <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("1");
  const [cartCount, setCartCount] = useState(0);
  const [isLoading] = useState(false);

  // ShoppingCart is used in cart button area — referenced via cartCount > 0
  void ShoppingCart;

  const filtered = MOCK_PRODUCTS.filter(p => p.category_id === activeCategory);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-cafe-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cafe-500">
            <Coffee className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Solo Cafe</h1>
            <p className="text-xs text-gray-500">Gọi món & lấy đi</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-50 text-gray-600">
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {MOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors tap-highlight-none ${
                activeCategory === cat.id
                  ? "bg-cafe-500 text-white shadow-sm"
                  : "bg-cafe-50 text-gray-600 hover:bg-cafe-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Product list */}
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <MenuSkeleton />
        ) : (
          <div className="space-y-3 p-4 pb-28">
            <p className="text-sm text-gray-500">{filtered.length} món</p>
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => setCartCount(c => c + 1)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
          <button className="flex w-full items-center justify-between rounded-2xl bg-cafe-600 px-5 py-4 shadow-lg text-white active:scale-95 transition-transform tap-highlight-none">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <span className="text-sm font-bold">{cartCount}</span>
              </div>
              <span className="font-semibold">Xem giỏ hàng</span>
            </div>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
