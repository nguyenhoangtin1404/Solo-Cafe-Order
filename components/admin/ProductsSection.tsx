"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/types/product";
import type { AdminProduct } from "@/lib/services/product.service";
import { ProductForm } from "./ProductForm";
import type { AdminViewGroup } from "./AdminView";

interface Props {
  groups: AdminViewGroup[];
  categories: Category[];
  onToggle: (productId: string, newValue: boolean) => Promise<void>;
  onProductCreated: (product: AdminProduct) => void;
  onProductUpdated: (oldCategoryId: string, product: AdminProduct) => void;
  onProductDeleted: (id: string, categoryId: string) => void;
  onCloseGlobalAdd?: () => void;
  formsResetToken?: number;
}

export function ProductsSection({
  groups,
  categories,
  onToggle,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
  onCloseGlobalAdd,
  formsResetToken,
}: Props) {
  const [failedImgUrls, setFailedImgUrls] = useState<Set<string>>(new Set());
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(
    null
  );
  const [confirmingProductId, setConfirmingProductId] = useState<string | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState("");

  const deletingIdsRef = useRef<Set<string>>(new Set());
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const deleteTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {}
  );
  const addTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null)
        clearTimeout(confirmTimerRef.current);
      if (announceTimerRef.current !== null)
        clearTimeout(announceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!formsResetToken) return;
    const t = setTimeout(() => {
      setEditingProductId(null);
      setAddingToCategoryId(null);
    }, 0);
    return () => clearTimeout(t);
  }, [formsResetToken]);

  useEffect(() => {
    if (confirmingProductId === null) return;
    confirmButtonRef.current?.focus();
  }, [confirmingProductId]);

  useEffect(() => {
    if (confirmingProductId === null) return;
    const stillVisible = groups.some((g) =>
      g.products.some((p) => p.id === confirmingProductId)
    );
    if (!stillVisible) {
      if (confirmTimerRef.current !== null) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
      const id = confirmingProductId;
      const t = setTimeout(() => {
        setConfirmingProductId(null);
        deleteTriggerRefs.current[id]?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [groups, confirmingProductId]);

  function announceStatus(message: string) {
    if (announceTimerRef.current !== null)
      clearTimeout(announceTimerRef.current);
    setStatusMessage(message);
    announceTimerRef.current = setTimeout(() => {
      setStatusMessage("");
      announceTimerRef.current = null;
    }, 3000);
  }

  function openAdd(categoryId: string) {
    if (confirmTimerRef.current !== null) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    onCloseGlobalAdd?.();
    setEditingProductId(null);
    setConfirmingProductId(null);
    setAddingToCategoryId(categoryId);
  }

  function openEdit(product: AdminProduct) {
    if (confirmTimerRef.current !== null) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setAddingToCategoryId(null);
    setConfirmingProductId(null);
    setEditingProductId(product.id);
  }

  function closeForm() {
    setEditingProductId(null);
    setAddingToCategoryId(null);
  }

  function requestDeleteConfirm(id: string) {
    setEditingProductId(null);
    setAddingToCategoryId(null);
    if (confirmTimerRef.current !== null) clearTimeout(confirmTimerRef.current);
    setConfirmingProductId(id);
    confirmTimerRef.current = setTimeout(() => {
      setConfirmingProductId(null);
      confirmTimerRef.current = null;
      announceStatus("Đã hủy xóa sản phẩm.");
      setTimeout(() => deleteTriggerRefs.current[id]?.focus(), 0);
    }, 3000);
  }

  function cancelConfirm() {
    if (confirmTimerRef.current !== null) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    const id = confirmingProductId;
    setConfirmingProductId(null);
    if (id) setTimeout(() => deleteTriggerRefs.current[id]?.focus(), 0);
  }

  async function handleDelete(id: string, categoryId: string) {
    // Clear confirm state without restoring focus — product is about to be removed
    if (confirmTimerRef.current !== null) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setConfirmingProductId(null);
    if (deletingIdsRef.current.has(id)) return;
    deletingIdsRef.current.add(id);

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Xóa thất bại.");
      }
      onProductDeleted(id, categoryId);
      delete editTriggerRefs.current[id];
      delete deleteTriggerRefs.current[id];
      announceStatus("Đã xóa sản phẩm.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại.");
    } finally {
      deletingIdsRef.current.delete(id);
    }
  }

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      {groups.map(({ category, products }) => (
        <section key={category.id} aria-labelledby={`cat-group-${category.id}`}>
          <h2
            id={`cat-group-${category.id}`}
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {category.name}
          </h2>

          <div className="space-y-2">
            {products.map((product) =>
              editingProductId === product.id ? (
                <ProductForm
                  key={product.id}
                  mode="edit"
                  initialData={product}
                  categories={categories}
                  onSuccess={(updated) => {
                    closeForm();
                    onProductUpdated(product.category_id, updated);
                    const categoryChanged =
                      updated.category_id !== product.category_id;
                    requestAnimationFrame(() => {
                      if (!categoryChanged) {
                        editTriggerRefs.current[updated.id]?.focus();
                      } else {
                        (
                          editTriggerRefs.current[updated.id] ??
                          addTriggerRefs.current[product.category_id]
                        )?.focus();
                      }
                    });
                  }}
                  onCancel={() => {
                    closeForm();
                    setTimeout(
                      () => editTriggerRefs.current[product.id]?.focus(),
                      0
                    );
                  }}
                />
              ) : (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {/* Thumbnail */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {product.image_url &&
                      !failedImgUrls.has(product.image_url) ? (
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={() =>
                            setFailedImgUrls((prev) =>
                              new Set(prev).add(product.image_url!)
                            )
                          }
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-full w-full items-center justify-center text-xl"
                        >
                          ☕
                        </span>
                      )}
                    </div>

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
                  </div>

                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    {product.pending ? (
                      <Loader2
                        size={16}
                        aria-hidden="true"
                        className="animate-spin text-muted-foreground"
                      />
                    ) : (
                      <>
                        {/* Availability toggle + label */}
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={product.is_available}
                            aria-label={`${product.name}: bật/tắt hiển thị`}
                            onClick={() =>
                              onToggle(product.id, !product.is_available)
                            }
                            className="relative flex min-h-[44px] w-11 shrink-0 cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span
                              aria-hidden="true"
                              className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                product.is_available ? "bg-primary" : "bg-input"
                              }`}
                            >
                              <span
                                className={`block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${
                                  product.is_available
                                    ? "translate-x-5"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </span>
                          </button>
                          <span
                            className={`text-[10px] font-semibold uppercase ${
                              product.is_available
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {product.is_available ? "ĐANG BÁN" : "HẾT HÀNG"}
                          </span>
                        </div>

                        {/* Edit */}
                        <button
                          type="button"
                          ref={(el) => {
                            editTriggerRefs.current[product.id] = el;
                          }}
                          onClick={() => openEdit(product)}
                          aria-label={`Sửa sản phẩm ${product.name}`}
                          className="min-h-[44px] rounded-lg border px-3 text-sm"
                        >
                          Sửa
                        </button>

                        {/* Delete */}
                        {confirmingProductId === product.id ? (
                          <button
                            type="button"
                            ref={confirmButtonRef}
                            onClick={() =>
                              handleDelete(product.id, product.category_id)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Escape") cancelConfirm();
                            }}
                            aria-label={`Xác nhận xóa sản phẩm ${product.name}`}
                            className="min-h-[44px] rounded-lg border border-destructive bg-destructive px-3 text-sm font-medium text-destructive-foreground"
                          >
                            Xóa?
                          </button>
                        ) : (
                          <button
                            type="button"
                            ref={(el) => {
                              deleteTriggerRefs.current[product.id] = el;
                            }}
                            onClick={() => requestDeleteConfirm(product.id)}
                            aria-label={`Xóa sản phẩm ${product.name}`}
                            className="min-h-[44px] rounded-lg border border-destructive px-3 text-sm text-destructive"
                          >
                            Xóa
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Empty state */}
            {products.length === 0 && addingToCategoryId !== category.id && (
              <div className="rounded-xl border border-dashed py-6 text-center text-muted-foreground">
                <p className="text-sm">Chưa có sản phẩm trong danh mục này</p>
              </div>
            )}

            {/* Add form */}
            {addingToCategoryId === category.id && (
              <ProductForm
                mode="create"
                categories={categories}
                defaultCategoryId={category.id}
                onSuccess={(product) => {
                  closeForm();
                  onProductCreated(product);
                  setTimeout(
                    () => addTriggerRefs.current[category.id]?.focus(),
                    0
                  );
                }}
                onCancel={() => {
                  closeForm();
                  setTimeout(
                    () => addTriggerRefs.current[category.id]?.focus(),
                    0
                  );
                }}
              />
            )}

            {/* Add button */}
            {addingToCategoryId !== category.id && (
              <button
                type="button"
                ref={(el) => {
                  addTriggerRefs.current[category.id] = el;
                }}
                onClick={() => openAdd(category.id)}
                aria-label={`Thêm sản phẩm vào ${category.name}`}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
              >
                <span aria-hidden="true">+</span> Thêm sản phẩm
              </button>
            )}
          </div>
        </section>
      ))}

      {/* Empty state when no categories */}
      {groups.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Tạo danh mục trước để thêm sản phẩm.
        </p>
      )}
    </>
  );
}
