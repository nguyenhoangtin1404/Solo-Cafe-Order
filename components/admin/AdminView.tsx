"use client";

import { useState } from "react";
import { toast } from "sonner";
import type {
  AdminCategoryGroup,
  AdminProduct,
} from "@/lib/services/product.service";
import type { Category } from "@/types/product";
import { CategoriesSection } from "./CategoriesSection";

type AdminProductState = AdminProduct & { pending?: boolean };

type CategoryWithProducts = {
  category: AdminCategoryGroup["category"];
  products: AdminProductState[];
};

interface Props {
  groups: AdminCategoryGroup[];
  categories: Category[];
}

export function AdminView({ groups: initial, categories }: Props) {
  const [groups, setGroups] = useState<CategoryWithProducts[]>(initial);

  async function handleToggle(productId: string, newValue: boolean) {
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
    } catch (err) {
      // Revert
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
      return;
    }

    // Clear pending flag
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        products: g.products.map((p) =>
          p.id === productId ? { ...p, pending: false } : p
        ),
      }))
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <h1 className="text-lg font-bold">Quản lý menu</h1>
      </header>

      <main className="space-y-6 px-4 py-4">
        <CategoriesSection initialCategories={categories} />

        {groups.map(({ category, products }) => (
          <section key={category.id}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>

                  <button
                    role="switch"
                    aria-checked={product.is_available}
                    aria-label={`Bật/tắt ${product.name}`}
                    disabled={product.pending}
                    onClick={() =>
                      handleToggle(product.id, !product.is_available)
                    }
                    className={`relative ml-4 inline-flex min-h-[44px] w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
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
