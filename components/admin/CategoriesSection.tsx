"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/types/product";

type CategoryState = Category & { pending?: boolean };

interface Props {
  initialCategories: Category[];
  productCounts: Record<string, number>;
  onCategoryCreated: (category: Category) => void;
  onCategoryDeleted: (id: string) => void;
  onCategoryUpdated: (category: Category) => void;
}

export function CategoriesSection({
  initialCategories,
  productCounts,
  onCategoryCreated,
  onCategoryDeleted,
  onCategoryUpdated,
}: Props) {
  const [categories, setCategories] =
    useState<CategoryState[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Ref mirrors editingId synchronously so async handlers can check the
  // latest value without relying on a stale closure.
  const editingIdRef = useRef<string | null>(null);
  // Refs for restoring focus after edit/add actions.
  const editTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const addTriggerRef = useRef<HTMLButtonElement | null>(null);
  // Tracks the active status-clear timer so it can be cancelled on re-fire.
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous guard against double-submit before React re-renders with creating=true.
  const creatingRef = useRef(false);
  // Per-category guards against concurrent PATCH and DELETE requests respectively.
  const updatingIdsRef = useRef<Set<string>>(new Set());
  const deletingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (announceTimerRef.current !== null)
        clearTimeout(announceTimerRef.current);
    };
  }, []);

  function startEdit(cat: CategoryState) {
    editingIdRef.current = cat.id;
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSortOrder(cat.sort_order);
  }

  function cancelEdit() {
    const id = editingIdRef.current;
    editingIdRef.current = null;
    setEditingId(null);
    setEditName("");
    setEditSortOrder(0);
    if (id) setTimeout(() => editTriggerRefs.current[id]?.focus(), 0);
  }

  function cancelAdd() {
    setAddingNew(false);
    setNewName("");
    setNewSortOrder(0);
    setTimeout(() => addTriggerRef.current?.focus(), 0);
  }

  function announceStatus(message: string) {
    if (announceTimerRef.current !== null)
      clearTimeout(announceTimerRef.current);
    setStatusMessage(message);
    announceTimerRef.current = setTimeout(() => {
      setStatusMessage("");
      announceTimerRef.current = null;
    }, 3000);
  }

  function setPending(id: string, pending: boolean) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pending } : c))
    );
  }

  function parseSortOrder(raw: string): number {
    const n = Number(raw);
    if (Number.isNaN(n)) return 0;
    return Math.min(9999, Math.max(0, Math.trunc(n)));
  }

  async function handleUpdate(id: string) {
    const name = editName.trim();
    if (!name) {
      toast.error("Tên danh mục không được để trống.");
      return;
    }
    if (updatingIdsRef.current.has(id)) return;
    const sortOrder = editSortOrder;
    updatingIdsRef.current.add(id);
    setStatusMessage("");
    setPending(id, true);
    // Intentionally keep editingId open so user can see/retry if request fails.

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sort_order: sortOrder }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        category?: Category;
        message?: string;
      };
      if (!res.ok) throw new Error(body.message ?? "Cập nhật thất bại.");
      const category = body.category;
      if (!category) throw new Error("Phản hồi không hợp lệ.");
      setCategories((prev) =>
        prev
          .map((c) => (c.id === id ? { ...category, pending: false } : c))
          .sort((a, b) => a.sort_order - b.sort_order)
      );
      onCategoryUpdated(category);
      // Only reset form state if user hasn't switched to editing a different item.
      if (editingIdRef.current === id) {
        editingIdRef.current = null;
        setEditingId(null);
        setEditName("");
        setEditSortOrder(0);
        announceStatus("Đã cập nhật danh mục thành công.");
        setTimeout(() => editTriggerRefs.current[id]?.focus(), 0);
      }
    } catch (err) {
      setPending(id, false);
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      updatingIdsRef.current.delete(id);
    }
  }

  async function handleDelete(id: string) {
    if (deletingIdsRef.current.has(id)) return;
    deletingIdsRef.current.add(id);
    if (!window.confirm("Xóa danh mục này?")) {
      deletingIdsRef.current.delete(id);
      return;
    }
    // Move focus before pending spinner replaces the action buttons on next render.
    addTriggerRef.current?.focus();
    setStatusMessage("");
    setPending(id, true);

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Xóa thất bại.");
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      onCategoryDeleted(id);
      announceStatus("Đã xóa danh mục.");
    } catch (err) {
      setPending(id, false);
      toast.error(err instanceof Error ? err.message : "Xóa thất bại.");
    } finally {
      deletingIdsRef.current.delete(id);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) {
      toast.error("Tên danh mục không được để trống.");
      return;
    }
    if (creatingRef.current) return;
    creatingRef.current = true;
    setStatusMessage("");
    setCreating(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sort_order: newSortOrder }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        category?: Category;
        message?: string;
      };
      if (!res.ok) throw new Error(body.message ?? "Thêm thất bại.");
      const category = body.category;
      if (!category) throw new Error("Phản hồi không hợp lệ.");
      setCategories((prev) =>
        [...prev, category].sort((a, b) => a.sort_order - b.sort_order)
      );
      onCategoryCreated(category);
      cancelAdd();
      announceStatus("Đã thêm danh mục thành công.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm thất bại.");
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }

  const hasPending = creating || categories.some((c) => c.pending);

  return (
    <section aria-labelledby="categories-section-heading">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {hasPending ? "Đang lưu thay đổi danh mục..." : ""}
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>
      <h2
        id="categories-section-heading"
        className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Danh mục
      </h2>
      <div className="space-y-2">
        {categories.map((cat) => {
          const count = productCounts[cat.id] ?? 0;
          const hasProducts = count > 0;
          return editingId === cat.id ? (
            <div
              key={cat.id}
              role="group"
              aria-label={`Chỉnh sửa danh mục: ${cat.name}`}
              className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-sm"
            >
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                aria-label="Tên danh mục"
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
                onChange={(e) =>
                  setEditSortOrder(parseSortOrder(e.target.value))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(cat.id);
                  if (e.key === "Escape") cancelEdit();
                }}
                min={0}
                max={9999}
                aria-label="Thứ tự hiển thị"
                className="min-h-[44px] w-16 rounded-lg border px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => handleUpdate(cat.id)}
                disabled={cat.pending}
                aria-label={`Lưu danh mục ${cat.name}`}
                className="min-h-[44px] rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Lưu
              </button>
              <button
                onClick={cancelEdit}
                aria-label={`Hủy chỉnh sửa ${cat.name}`}
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
                  {count > 0 && ` · ${count} sản phẩm`}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                {cat.pending ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin text-muted-foreground"
                  />
                ) : (
                  <>
                    <button
                      ref={(el) => {
                        editTriggerRefs.current[cat.id] = el;
                      }}
                      onClick={() => startEdit(cat)}
                      aria-label={`Sửa danh mục ${cat.name}`}
                      className="min-h-[44px] rounded-lg border px-3 text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      disabled={hasProducts}
                      onClick={() => handleDelete(cat.id)}
                      aria-label={`Xóa danh mục ${cat.name}`}
                      aria-describedby={
                        hasProducts ? `del-hint-${cat.id}` : undefined
                      }
                      className="min-h-[44px] rounded-lg border border-destructive px-3 text-sm text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Xóa
                    </button>
                    {hasProducts && (
                      <span id={`del-hint-${cat.id}`} className="sr-only">
                        Xóa hết sản phẩm trước khi xóa danh mục
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {categories.length === 0 && !addingNew && (
          <div className="rounded-xl border border-dashed py-8 text-center text-muted-foreground">
            <p className="text-sm font-medium">Chưa có danh mục nào</p>
            <p className="mt-1 text-xs">
              Tạo danh mục đầu tiên để bắt đầu thêm sản phẩm vào menu
            </p>
          </div>
        )}

        {addingNew ? (
          <div
            role="group"
            aria-label="Thêm danh mục mới"
            className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-sm"
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
              aria-label="Tên danh mục mới"
              className="min-h-[44px] flex-1 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Tên danh mục mới"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape" && !creatingRef.current) cancelAdd();
              }}
            />
            <input
              type="number"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(parseSortOrder(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape" && !creatingRef.current) cancelAdd();
              }}
              min={0}
              max={9999}
              aria-label="Thứ tự hiển thị"
              className="min-h-[44px] w-16 rounded-lg border px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              aria-label="Thêm danh mục mới"
              className="min-h-[44px] rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Thêm
            </button>
            {creating && (
              <span id="add-cancel-hint" className="sr-only">
                Đang xử lý, vui lòng chờ
              </span>
            )}
            <button
              onClick={cancelAdd}
              disabled={creating}
              aria-label="Hủy thêm danh mục"
              aria-describedby={creating ? "add-cancel-hint" : undefined}
              className="min-h-[44px] rounded-lg border px-3 text-sm text-muted-foreground disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            ref={addTriggerRef}
            onClick={() => setAddingNew(true)}
            aria-label="Thêm danh mục"
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            <span aria-hidden="true">+</span> Thêm danh mục
          </button>
        )}
      </div>
    </section>
  );
}
