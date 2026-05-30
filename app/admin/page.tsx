"use client";

import { useState } from "react";
import { Plus, Search, ToggleLeft, ToggleRight, Pencil, Trash2, ArrowLeft, Settings, Coffee } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  product_count: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  is_available: boolean;
  image_url: string | null;
}

const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Cà Phê", product_count: 4 },
  { id: "2", name: "Trà Sữa", product_count: 3 },
  { id: "3", name: "Nước Ép", product_count: 2 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Cà Phê Sữa Đá", price: 40000, category_id: "1", is_available: true, image_url: null },
  { id: "2", name: "Bạc Xỉu", price: 30000, category_id: "1", is_available: true, image_url: null },
  { id: "3", name: "Cà Phê Đen", price: 25000, category_id: "1", is_available: false, image_url: null },
  { id: "4", name: "Cappuccino", price: 45000, category_id: "1", is_available: true, image_url: null },
  { id: "5", name: "Trà Sữa Truyền Thống", price: 40000, category_id: "2", is_available: true, image_url: null },
  { id: "6", name: "Trà Sữa Matcha", price: 45000, category_id: "2", is_available: false, image_url: null },
];

function AdminSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white border border-cafe-100 p-3 space-y-2">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [activeCategory, setActiveCategory] = useState("1");
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [isLoading] = useState(false);

  const filtered = products.filter(
    p =>
      p.category_id === activeCategory &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleAvailability(id: string) {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, is_available: !p.is_available } : p)),
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-cafe-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-50">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Settings className="h-5 w-5 text-cafe-600" />
            <h1 className="font-bold text-gray-900 text-lg">Quản lý Menu</h1>
          </div>
          <button className="flex h-10 items-center gap-1.5 rounded-xl bg-cafe-600 px-3 text-white text-sm font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Thêm món
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm món..."
              className="w-full rounded-xl border border-cafe-200 pl-10 pr-4 py-2.5 text-sm focus:border-cafe-500 focus:outline-none focus:ring-2 focus:ring-cafe-200"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {MOCK_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat.id ? "bg-cafe-600 text-white" : "bg-cafe-50 text-gray-600"
              }`}
            >
              {cat.name}{" "}
              <span className="opacity-70">({cat.product_count})</span>
            </button>
          ))}
          <button className="shrink-0 flex items-center gap-1 rounded-full border border-dashed border-cafe-300 px-3.5 py-1.5 text-sm text-cafe-600">
            <Plus className="h-3.5 w-3.5" />
            Danh mục
          </button>
        </div>
      </header>

      {/* Products grid */}
      <main className="flex-1">
        {isLoading ? (
          <AdminSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Coffee className="h-12 w-12 text-cafe-200" />
            <p className="text-sm">Chưa có món nào</p>
            <button className="rounded-xl bg-cafe-600 px-4 py-2.5 text-sm font-semibold text-white">
              Thêm món đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {filtered.map(product => (
              <div
                key={product.id}
                className={`rounded-xl bg-white border shadow-sm overflow-hidden ${
                  product.is_available ? "border-cafe-100" : "border-gray-200 opacity-75"
                }`}
              >
                {/* Image placeholder */}
                <div className="relative h-28 bg-cafe-50 flex items-center justify-center">
                  <Coffee className="h-10 w-10 text-cafe-200" />
                  {!product.is_available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        Ẩn
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 space-y-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                    <p className="text-cafe-700 font-bold text-sm">{formatPrice(product.price)}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleAvailability(product.id)}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                        product.is_available ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.is_available ? (
                        <ToggleRight className="h-3.5 w-3.5" />
                      ) : (
                        <ToggleLeft className="h-3.5 w-3.5" />
                      )}
                      {product.is_available ? "Có" : "Hết"}
                    </button>

                    <div className="flex gap-1">
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-cafe-50 text-cafe-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
