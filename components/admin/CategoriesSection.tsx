"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/types/product";

type CategoryState = Category & { pending?: boolean };

interface Props {
  initialCategories: Category[];
}

export function CategoriesSection({ initialCategories }: Props) {
  const [categories, setCategories] =
    useState<CategoryState[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [creating, setCreating] = useState(false);

  function startEdit(cat: CategoryState) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSortOrder(cat.sort_order);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(id: string) {
    const name = editName.trim();
    if (!name) return;

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pending: true } : c))
    );
    setEditingId(null);

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sort_order: editSortOrder }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Cập nhật thất bại.");
      }
      const { category } = (await res.json()) as { category: Category };
      setCategories((prev) =>
        prev
          .map((c) => (c.id === id ? { ...category, pending: false } : c))
          .sort((a, b) => a.sort_order - b.sort_order)
      );
    } catch (err) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pending: false } : c))
      );
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Xóa danh mục này?")) return;

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pending: true } : c))
    );

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Xóa thất bại.");
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pending: false } : c))
      );
      toast.error(err instanceof Error ? err.message : "Xóa thất bại.");
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sort_order: newSortOrder }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Thêm thất bại.");
      }
      const { category } = (await res.json()) as { category: Category };
      setCategories((prev) =>
        [...prev, category].sort((a, b) => a.sort_order - b.sort_order)
      );
      setNewName("");
      setNewSortOrder(0);
      setAddingNew(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm thất bại.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Danh mục
      </h2>
      <div className="space-y-2">
        {categories.map((cat) =>
          editingId === cat.id ? (
            <div
              key={cat.id}
              className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-sm"
            >
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                className="min-h-[44px] flex-1 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tên danh mục"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(cat.id);
                  if (e.key === "Escape") cancelEdit();
                }}
              />
              <input
                type="number"
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(Number(e.target.value))}
                min={0}
                className="min-h-[44px] w-16 rounded-lg border px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Thứ tự sắp xếp"
              />
              <button
                onClick={() => handleUpdate(cat.id)}
                className="min-h-[44px] rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                Lưu
              </button>
              <button
                onClick={cancelEdit}
                className="min-h-[44px] rounded-lg border px-3 text-sm text-muted-foreground"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  Thứ tự: {cat.sort_order}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 gap-2">
                <button
                  disabled={cat.pending}
                  onClick={() => startEdit(cat)}
                  className="min-h-[44px] rounded-lg border px-3 text-sm disabled:opacity-50"
                >
                  Sửa
                </button>
                <button
                  disabled={cat.pending}
                  onClick={() => handleDelete(cat.id)}
                  className="min-h-[44px] rounded-lg border border-destructive px-3 text-sm text-destructive disabled:opacity-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          )
        )}

        {addingNew ? (
          <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-sm">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
              className="min-h-[44px] flex-1 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Tên danh mục mới"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setAddingNew(false);
              }}
            />
            <input
              type="number"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(Number(e.target.value))}
              min={0}
              className="min-h-[44px] w-16 rounded-lg border px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              title="Thứ tự"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="min-h-[44px] rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Thêm
            </button>
            <button
              onClick={() => setAddingNew(false)}
              className="min-h-[44px] rounded-lg border px-3 text-sm text-muted-foreground"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingNew(true)}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            + Thêm danh mục
          </button>
        )}
      </div>
    </section>
  );
}
