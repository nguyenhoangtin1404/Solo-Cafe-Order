"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { ProductOption, ProductOptionValue, ProductOptionWithValues } from "@/types/product";
import { ValueRow } from "./ValueRow";
import { AddValueForm } from "./AddValueForm";

const inputCls =
  "min-h-[44px] w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

interface EditDraft {
  name: string;
  type: "select" | "multi";
}

interface Props {
  option: ProductOptionWithValues;
  productId: string;
  onUpdated: (fields: Pick<ProductOption, "name" | "type">) => void;
  onDeleted: () => void;
  onValueAdded: (value: ProductOptionValue) => void;
  onValueUpdated: (value: ProductOptionValue) => void;
  onValueDeleted: (valueId: string) => void;
}

export function OptionRow({
  option,
  productId,
  onUpdated,
  onDeleted,
  onValueAdded,
  onValueUpdated,
  onValueDeleted,
}: Props) {
  const [editing, setEditing] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    name: option.name,
    type: option.type,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pendingType, setPendingType] = useState<"select" | "multi" | null>(null);

  useEffect(() => {
    if (editing) editInputRef.current?.focus();
  }, [editing]);
  useEffect(() => {
    if (confirming) confirmBtnRef.current?.focus();
  }, [confirming]);

  async function submitEdit() {
    if (!editDraft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/options/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editDraft.name.trim(), type: editDraft.type }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        option?: Pick<ProductOption, "name" | "type">;
        code?: string;
        message?: string;
      };
      if (!res.ok) {
        console.error("[OptionRow] submitEdit error", data.code, data.message);
        throw new Error(data.message ?? "Cập nhật thất bại.");
      }
      if (
        !data.option ||
        typeof data.option.name !== "string" ||
        (data.option.type !== "select" && data.option.type !== "multi")
      ) {
        throw new Error("Phản hồi không hợp lệ.");
      }
      onUpdated(data.option);
      setEditing(false);
      setPendingType(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setConfirming(false);
    try {
      const res = await fetch(`/api/products/${productId}/options/${option.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Xóa thất bại.");
      }
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại.");
    } finally {
      setDeleting(false);
    }
  }

  function handleTypeChange(newType: "select" | "multi") {
    if (option.values.length > 0 && newType !== option.type) {
      setPendingType(newType);
    } else {
      setEditDraft((d) => ({ ...d, type: newType }));
    }
  }

  function startEditing() {
    setEditDraft({ name: option.name, type: option.type });
    setEditing(true);
    setPendingType(null);
  }

  return (
    <div className="rounded-lg border px-3 py-3">
      {/* Option header */}
      {editing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={editInputRef}
              value={editDraft.name}
              onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
              maxLength={50}
              disabled={saving}
              aria-label="Tên option"
              className={`${inputCls} flex-1`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) submitEdit();
                if (e.key === "Escape" && !saving) {
                  setEditing(false);
                  setPendingType(null);
                }
              }}
            />
            <select
              value={editDraft.type}
              onChange={(e) => handleTypeChange(e.target.value as "select" | "multi")}
              disabled={saving}
              aria-label="Kiểu chọn"
              className={`${inputCls} w-28 bg-background`}
            >
              <option value="select">Chọn 1</option>
              <option value="multi">Nhiều</option>
            </select>
            <button
              type="button"
              onClick={submitEdit}
              disabled={saving || !editDraft.name.trim()}
              aria-label="Lưu option"
              className="min-h-[44px] rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                "Lưu"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setPendingType(null);
              }}
              disabled={saving}
              aria-label="Hủy sửa option"
              className="min-h-[44px] rounded-lg border px-3 text-sm text-muted-foreground disabled:opacity-50"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          {pendingType && (
            <div
              role="alert"
              className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
              onKeyDown={(e) => {
                if (e.key === "Escape") setPendingType(null);
              }}
            >
              Thay đổi type sẽ áp dụng cho đơn hàng mới. Đơn hàng đã đặt không bị ảnh hưởng.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  setEditDraft((d) => ({ ...d, type: pendingType }));
                  setPendingType(null);
                }}
              >
                Tiếp tục
              </button>
              {" · "}
              <button
                type="button"
                className="underline"
                onClick={() => setPendingType(null)}
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      ) : confirming ? (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1">
          <span className="text-sm text-destructive">
            Xóa &ldquo;{option.name}&rdquo; và tất cả values?
          </span>
          <div className="flex gap-1">
            <button
              ref={confirmBtnRef}
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Xác nhận xóa option"
              className="min-h-[44px] rounded-lg bg-destructive px-3 text-sm text-destructive-foreground disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                "Xóa"
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              aria-label="Hủy xóa option"
              className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border text-muted-foreground"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{option.name}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {option.type === "select" ? "Chọn 1" : "Nhiều"}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={startEditing}
              disabled={deleting}
              aria-label={`Sửa option ${option.name}`}
              className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={deleting}
              aria-label={`Xóa option ${option.name}`}
              className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border border-destructive text-destructive disabled:opacity-50"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Values list */}
      {option.values.length > 0 && (
        <ul className="mt-2 space-y-1" aria-label={`Values của ${option.name}`}>
          {option.values.map((value) => (
            <ValueRow
              key={value.id}
              value={value}
              optionId={option.id}
              productId={productId}
              onUpdated={onValueUpdated}
              onDeleted={onValueDeleted}
            />
          ))}
        </ul>
      )}

      <AddValueForm
        optionId={option.id}
        productId={productId}
        optionName={option.name}
        onValueAdded={onValueAdded}
      />
    </div>
  );
}
