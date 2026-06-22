"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { ProductOptionValue } from "@/types/product";
import { parseExtraPrice } from "@/lib/utils";

const inputCls =
  "min-h-[44px] w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

interface Draft {
  name: string;
  extra_price: string;
}

const emptyDraft = (): Draft => ({ name: "", extra_price: "0" });

interface Props {
  optionId: string;
  productId: string;
  optionName: string;
  onValueAdded: (value: ProductOptionValue) => void;
}

export function AddValueForm({ optionId, productId, optionName, onValueAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submitAdd() {
    if (!draft.name.trim()) return;
    const extra_price = parseExtraPrice(draft.extra_price);
    if (extra_price === null) {
      toast.error("Giá thêm phải là số nguyên từ 0 đến 500,000.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/options/${optionId}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name.trim(), extra_price }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        value?: ProductOptionValue;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Thêm value thất bại.");
      if (!data.value) throw new Error("Phản hồi không hợp lệ.");
      onValueAdded(data.value);
      setOpen(false);
      setDraft(emptyDraft());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm value thất bại.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Thêm value vào ${optionName}`}
        className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
      >
        <Plus size={12} aria-hidden="true" /> Thêm value
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        ref={inputRef}
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        maxLength={50}
        disabled={saving}
        aria-label="Tên value mới"
        placeholder="Tên value *"
        className={`${inputCls} flex-1`}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !saving) submitAdd();
          if (e.key === "Escape" && !saving) {
            setOpen(false);
            setDraft(emptyDraft());
          }
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
          if (e.key === "Enter" && !saving) submitAdd();
          if (e.key === "Escape" && !saving) {
            setOpen(false);
            setDraft(emptyDraft());
          }
        }}
      />
      <button
        type="button"
        onClick={submitAdd}
        disabled={saving || !draft.name.trim()}
        aria-label="Thêm value"
        className="min-h-[44px] rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          "Thêm"
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setDraft(emptyDraft());
        }}
        disabled={saving}
        aria-label="Hủy thêm value"
        className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border disabled:opacity-50"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
