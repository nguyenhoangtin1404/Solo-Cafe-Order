"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { ProductOptionValue } from "@/types/product";
import { parseExtraPrice } from "@/lib/utils";

const inputCls =
  "min-h-[44px] w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

interface Props {
  value: ProductOptionValue;
  optionId: string;
  productId: string;
  onUpdated: (value: ProductOptionValue) => void;
  onDeleted: (valueId: string) => void;
}

interface Draft {
  name: string;
  extra_price: string;
}

export function ValueRow({ value, optionId, productId, onUpdated, onDeleted }: Props) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    name: value.name,
    extra_price: String(value.extra_price),
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (confirming) confirmBtnRef.current?.focus();
  }, [confirming]);

  async function submitEdit() {
    if (!draft.name.trim()) return;
    const extra_price = parseExtraPrice(draft.extra_price);
    if (extra_price === null) {
      toast.error("Giá thêm phải là số nguyên từ 0 đến 500,000.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/products/${productId}/options/${optionId}/values/${value.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: draft.name.trim(), extra_price }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        value?: ProductOptionValue;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Cập nhật thất bại.");
      if (
        !data.value ||
        typeof data.value.name !== "string" ||
        typeof data.value.extra_price !== "number"
      )
        throw new Error("Phản hồi không hợp lệ.");
      onUpdated(data.value);
      setEditing(false);
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
      const res = await fetch(
        `/api/products/${productId}/options/${optionId}/values/${value.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Xóa thất bại.");
      }
      onDeleted(value.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại.");
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <li className="flex gap-2">
        <input
          autoFocus
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          maxLength={50}
          disabled={saving}
          aria-label="Tên value"
          className={`${inputCls} flex-1`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !saving) submitEdit();
            if (e.key === "Escape" && !saving) setEditing(false);
          }}
        />
        <input
          type="text"
          inputMode="numeric"
          value={draft.extra_price}
          onChange={(e) => setDraft((d) => ({ ...d, extra_price: e.target.value }))}
          disabled={saving}
          aria-label="Giá thêm (VND)"
          placeholder="+giá"
          className={`${inputCls} w-24`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !saving) submitEdit();
            if (e.key === "Escape" && !saving) setEditing(false);
          }}
        />
        <button
          type="button"
          onClick={submitEdit}
          disabled={saving || !draft.name.trim()}
          aria-label="Lưu value"
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
          onClick={() => setEditing(false)}
          disabled={saving}
          aria-label="Hủy sửa value"
          className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border disabled:opacity-50"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </li>
    );
  }

  if (confirming) {
    return (
      <li className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
        <span className="text-sm text-destructive">Xóa &ldquo;{value.name}&rdquo;?</span>
        <div className="flex gap-1">
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Xác nhận xóa value"
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
            aria-label="Hủy xóa value"
            className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border text-muted-foreground"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-sm">
        {value.name}
        {value.extra_price > 0 && (
          <span className="ml-1 text-muted-foreground">
            +{value.extra_price.toLocaleString("vi-VN")}đ
          </span>
        )}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => {
            setDraft({ name: value.name, extra_price: String(value.extra_price) });
            setEditing(true);
          }}
          disabled={deleting}
          aria-label={`Sửa value ${value.name}`}
          className="flex min-h-[44px] w-11 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Pencil size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={deleting}
          aria-label={`Xóa value ${value.name}`}
          className="flex min-h-[44px] w-11 items-center justify-center text-destructive disabled:opacity-50"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
