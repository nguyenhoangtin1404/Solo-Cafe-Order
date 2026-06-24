"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AdminCategoryGroup,
  AdminProduct,
} from "@/lib/services/product.service";
import type { Category } from "@/types/product";
import { CategoriesSection } from "./CategoriesSection";
import { ProductForm } from "./ProductForm";
import { ProductsSection } from "./ProductsSection";

type AdminProductState = AdminProduct & { pending?: boolean };

export type AdminViewGroup = {
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
  const [showGlobalAdd, setShowGlobalAdd] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [formsResetToken, setFormsResetToken] = useState(0);
  const togglingIdsRef = useRef<Set<string>>(new Set());
  const toggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globalAddRef = useRef<HTMLDivElement>(null);
  const headerAddButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      if (toggleTimerRef.current !== null) clearTimeout(toggleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showGlobalAdd) return;
    requestAnimationFrame(() => {
      const first = globalAddRef.current?.querySelector<HTMLElement>(
        "input, select, textarea, button"
      );
      first?.focus();
    });
  }, [showGlobalAdd]);

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

  const filteredGroups = useMemo(
    () =>
      selectedCategoryId
        ? groups.filter((g) => g.category.id === selectedCategoryId)
        : groups,
    [groups, selectedCategoryId]
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
    setSelectedCategoryId((prev) => (prev === id ? null : prev));
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
    announceToggle(`Đang cập nhật ${productName}…`);
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
      announceToggle(`Cập nhật ${productName} thất bại.`);
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      togglingIdsRef.current.delete(productId);
    }
  }

  function handleProductCreated(product: AdminProduct) {
    setGroups((prev) => {
      if (!prev.some((g) => g.category.id === product.category_id)) {
        setTimeout(
          () =>
            toast.error("Danh mục không còn tồn tại. Vui lòng tải lại trang."),
          0
        );
        return prev;
      }
      return prev.map((g) =>
        g.category.id === product.category_id
          ? { ...g, products: [...g.products, product] }
          : g
      );
    });
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
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toggleStatusMessage}
      </div>
      <header className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Quản lý menu</h1>
          <button
            type="button"
            ref={headerAddButtonRef}
            onClick={() => {
              setFormsResetToken((t) => t + 1);
              setShowGlobalAdd(true);
            }}
            disabled={showGlobalAdd || categories.length === 0}
            aria-expanded={categories.length === 0 ? undefined : showGlobalAdd}
            aria-controls="global-add-form"
            title={
              categories.length === 0
                ? "Tạo danh mục trước để thêm sản phẩm"
                : undefined
            }
            className="flex min-h-[44px] items-center gap-1 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            <span aria-hidden="true">+</span> Thêm sản phẩm
          </button>
        </div>
      </header>

      <main className="space-y-6 px-4 py-4">
        {showGlobalAdd && (
          <div ref={globalAddRef} id="global-add-form">
            <ProductForm
              mode="create"
              categories={categories}
              onSuccess={(product) => {
                setShowGlobalAdd(false);
                setSelectedCategoryId(null);
                handleProductCreated(product);
                requestAnimationFrame(() =>
                  headerAddButtonRef.current?.focus()
                );
              }}
              onCancel={() => {
                setShowGlobalAdd(false);
                requestAnimationFrame(() =>
                  headerAddButtonRef.current?.focus()
                );
              }}
            />
          </div>
        )}

        <CategoriesSection
          initialCategories={categories}
          productCounts={productCounts}
          onCategoryCreated={handleCategoryCreated}
          onCategoryDeleted={handleCategoryDeleted}
          onCategoryUpdated={handleCategoryUpdated}
        />

        {categories.length > 0 && (
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Lọc theo danh mục"
          >
            <button
              type="button"
              onClick={() => {
                setFormsResetToken((t) => t + 1);
                setSelectedCategoryId(null);
              }}
              aria-pressed={selectedCategoryId === null}
              className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
                selectedCategoryId === null
                  ? "bg-primary text-primary-foreground"
                  : "border text-muted-foreground hover:border-foreground"
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setFormsResetToken((t) => t + 1);
                  setSelectedCategoryId(cat.id);
                }}
                aria-pressed={selectedCategoryId === cat.id}
                className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "border text-muted-foreground hover:border-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <ProductsSection
          groups={filteredGroups}
          categories={categories}
          formsResetToken={formsResetToken}
          onToggle={handleToggle}
          onProductCreated={handleProductCreated}
          onProductUpdated={handleProductUpdated}
          onProductDeleted={handleProductDeleted}
          onCloseGlobalAdd={() => setShowGlobalAdd(false)}
          fallbackFocusRef={headerAddButtonRef}
        />
      </main>
    </div>
  );
}
