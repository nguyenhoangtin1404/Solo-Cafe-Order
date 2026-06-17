"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AdminCategoryGroup,
  AdminProduct,
} from "@/lib/services/product.service";
import type { Category } from "@/types/product";
import { CategoriesSection } from "./CategoriesSection";
import { ProductsSection } from "./ProductsSection";

type AdminProductState = AdminProduct & { pending?: boolean };

type AdminViewGroup = {
  category: AdminCategoryGroup["category"];
  products: AdminProductState[];
};

interface Props {
  groups: AdminCategoryGroup[];
  categories: Category[];
}

export function AdminView({
  groups: initial,
  categories: initialCategories,
}: Props) {
  const [groups, setGroups] = useState<AdminViewGroup[]>(initial);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [toggleStatusMessage, setToggleStatusMessage] = useState("");
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

  const productCounts = useMemo(
    () =>
      Object.fromEntries(groups.map((g) => [g.category.id, g.products.length])),
    [groups]
  );

  const productNames = useMemo(
    () =>
      Object.fromEntries(
        groups.flatMap((g) => g.products).map((p) => [p.id, p.name])
      ),
    [groups]
  );

  // ── Category callbacks ────────────────────────────────────────────────────

  function handleCategoryCreated(category: Category) {
    setGroups((prev) =>
      [...prev, { category, products: [] }].sort(
        (a, b) => a.category.sort_order - b.category.sort_order
      )
    );
    setCategories((prev) =>
      [...prev, category].sort((a, b) => a.sort_order - b.sort_order)
    );
  }

  function handleCategoryDeleted(id: string) {
    setGroups((prev) => prev.filter((g) => g.category.id !== id));
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function handleCategoryUpdated(category: Category) {
    setGroups((prev) =>
      prev
        .map((g) => (g.category.id === category.id ? { ...g, category } : g))
        .sort((a, b) => a.category.sort_order - b.category.sort_order)
    );
    setCategories((prev) =>
      prev
        .map((c) => (c.id === category.id ? category : c))
        .sort((a, b) => a.sort_order - b.sort_order)
    );
  }

  // ── Product callbacks ─────────────────────────────────────────────────────

  function setPending(productId: string, pending: boolean) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        products: g.products.map((p) =>
          p.id === productId ? { ...p, pending } : p
        ),
      }))
    );
  }

  async function handleToggle(productId: string, newValue: boolean) {
    if (togglingIdsRef.current.has(productId)) return;
    togglingIdsRef.current.add(productId);
    const productName = productNames[productId] ?? "";
    // Optimistic update
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
      setPending(productId, false);
      announceToggle(
        `${productName}: ${newValue ? "đang hiển thị trên menu" : "đã ẩn khỏi menu"}.`
      );
    } catch (err) {
      // Rollback
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

  function handleProductCreated(product: AdminProduct) {
    if (!groups.some((g) => g.category.id === product.category_id)) {
      toast.error("Danh mục không còn tồn tại. Vui lòng tải lại trang.");
      return;
    }
    setGroups((prev) =>
      prev.map((g) =>
        g.category.id === product.category_id
          ? { ...g, products: [...g.products, product] }
          : g
      )
    );
  }

  function handleProductUpdated(oldCategoryId: string, product: AdminProduct) {
    setGroups((prev) =>
      prev.map((g) => {
        if (
          g.category.id === oldCategoryId &&
          g.category.id !== product.category_id
        ) {
          return {
            ...g,
            products: g.products.filter((p) => p.id !== product.id),
          };
        }
        if (g.category.id === product.category_id) {
          const exists = g.products.some((p) => p.id === product.id);
          return {
            ...g,
            products: exists
              ? g.products.map((p) => (p.id === product.id ? product : p))
              : [...g.products, product],
          };
        }
        return g;
      })
    );
  }

  function handleProductDeleted(id: string, categoryId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.category.id === categoryId
          ? { ...g, products: g.products.filter((p) => p.id !== id) }
          : g
      )
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toggleStatusMessage}
      </div>
      <header className="border-b px-4 py-3">
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

        <ProductsSection
          groups={groups}
          categories={categories}
          onToggle={handleToggle}
          onProductCreated={handleProductCreated}
          onProductUpdated={handleProductUpdated}
          onProductDeleted={handleProductDeleted}
        />
      </main>
    </div>
  );
}
