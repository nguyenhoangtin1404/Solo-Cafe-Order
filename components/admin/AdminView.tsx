"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AdminCategoryGroup,
  AdminProduct,
} from "@/lib/services/product.service";
import type { Category } from "@/types/product";
import { CategoriesSection } from "./CategoriesSection";

type AdminProductState = AdminProduct & { pending?: boolean };

type AdminViewGroup = {
  category: AdminCategoryGroup["category"];
  products: AdminProductState[];
};

interface Props {
  groups: AdminCategoryGroup[];
  categories: Category[];
}

export function AdminView({ groups: initial, categories }: Props) {
  const [groups, setGroups] = useState<AdminViewGroup[]>(initial);
  const [toggleStatusMessage, setToggleStatusMessage] = useState("");
  // Synchronous guard against concurrent PATCH requests on the same product.
  const togglingIdsRef = useRef<Set<string>>(new Set());
  const toggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toggleTimerRef.current !== null) clearTimeout(toggleTimerRef.current);
    };
  }, []);

  function announceToggle(message: string) {
    if (toggleTimerRef.current !== null) clearTimeout(toggleTimerRef.current);
    setToggleStatusMessage(message);
    toggleTimerRef.current = setTimeout(() => {
      setToggleStatusMessage("");
      toggleTimerRef.current = null;
    }, 3000);
  }

  // Derived from live groups state so it stays accurate after toggle/delete.
  const productCounts = Object.fromEntries(
    groups.map((g) => [g.category.id, g.products.length])
  );

  function handleCategoryCreated(category: Category) {
    setGroups((prev) =>
      [...prev, { category, products: [] }].sort(
        (a, b) => a.category.sort_order - b.category.sort_order
      )
    );
  }

  function handleCategoryDeleted(id: string) {
    setGroups((prev) => prev.filter((g) => g.category.id !== id));
  }

  function handleCategoryUpdated(category: Category) {
    setGroups((prev) =>
      prev
        .map((g) => (g.category.id === category.id ? { ...g, category } : g))
        .sort((a, b) => a.category.sort_order - b.category.sort_order)
    );
  }

  async function handleToggle(productId: string, newValue: boolean) {
    if (togglingIdsRef.current.has(productId)) return;
    togglingIdsRef.current.add(productId);
    const productName =
      groups.flatMap((g) => g.products).find((p) => p.id === productId)?.name ??
      "";
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        products: g.products.map((p) =>
          p.id === productId
            ? { ...p, is_available: newValue, pending: true }
            : p
        ),
      }))
    );

    try {
      const res = await fetch(`/api/products/${productId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: newValue }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Cập nhật thất bại.");
      }
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          products: g.products.map((p) =>
            p.id === productId ? { ...p, pending: false } : p
          ),
        }))
      );
      announceToggle(
        `${productName}: ${newValue ? "đang hiển thị trên menu" : "đã ẩn khỏi menu"}.`
      );
    } catch (err) {
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          products: g.products.map((p) =>
            p.id === productId
              ? { ...p, is_available: !newValue, pending: false }
              : p
          ),
        }))
      );
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      togglingIdsRef.current.delete(productId);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toggleStatusMessage}
      </div>
      <header role="banner" className="border-b px-4 py-3">
        <h1 className="text-lg font-bold">Quản lý menu</h1>
      </header>

      <main className="space-y-6 px-4 py-4">
        <CategoriesSection
          initialCategories={categories}
          productCounts={productCounts}
          onCategoryCreated={handleCategoryCreated}
          onCategoryDeleted={handleCategoryDeleted}
          onCategoryUpdated={handleCategoryUpdated}
        />

        {groups.map(({ category, products }) => (
          <section
            key={category.id}
            aria-labelledby={`cat-group-${category.id}`}
          >
            <h2
              id={`cat-group-${category.id}`}
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {category.name}
            </h2>
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p
                      className={`truncate font-medium ${
                        !product.is_available
                          ? "text-muted-foreground line-through"
                          : ""
                      }`}
                    >
                      {product.name}
                      {!product.is_available && (
                        <span className="sr-only"> (không có sẵn)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>

                  <button
                    role="switch"
                    aria-checked={product.is_available}
                    aria-label={`${product.name}: bật/tắt hiển thị trên menu`}
                    disabled={product.pending}
                    onClick={() =>
                      handleToggle(product.id, !product.is_available)
                    }
                    className="relative ml-4 flex min-h-[44px] w-11 shrink-0 cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        product.is_available ? "bg-primary" : "bg-input"
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          product.is_available
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
