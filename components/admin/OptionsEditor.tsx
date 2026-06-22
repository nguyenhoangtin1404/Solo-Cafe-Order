"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type {
  ProductOption,
  ProductOptionValue,
  ProductOptionWithValues,
} from "@/types/product";
import { OptionRow } from "./OptionRow";

const inputCls =
  "min-h-[44px] w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

interface OptionDraft {
  name: string;
  type: "select" | "multi";
}

const emptyOption = (): OptionDraft => ({ name: "", type: "select" });

interface Props {
  productId: string;
}

export function OptionsEditor({ productId }: Props) {
  const [options, setOptions] = useState<ProductOptionWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingOption, setAddingOption] = useState(false);
  const [optionDraft, setOptionDraft] = useState<OptionDraft>(emptyOption);
  const [savingOption, setSavingOption] = useState(false);
  const addOptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/${productId}/options`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ options?: ProductOptionWithValues[] }>;
      })
      .then((data) => setOptions(data.options ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") toast.error("Không tải được options.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [productId]);

  useEffect(() => {
    if (addingOption) addOptionInputRef.current?.focus();
  }, [addingOption]);

  async function submitAddOption() {
    if (!optionDraft.name.trim()) return;
    setSavingOption(true);
    try {
      const res = await fetch(`/api/products/${productId}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: optionDraft.name.trim(),
          type: optionDraft.type,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        option?: ProductOption;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Thêm option thất bại.");
      if (!data.option) throw new Error("Phản hồi không hợp lệ.");
      const opt = data.option;
      if (
        typeof opt.id !== "string" ||
        typeof opt.name !== "string" ||
        (opt.type !== "select" && opt.type !== "multi")
      ) {
        throw new Error("Phản hồi không hợp lệ.");
      }
      setOptions((prev) => [...prev, { ...opt, values: [] }]);
      setAddingOption(false);
      setOptionDraft(emptyOption());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm option thất bại.");
    } finally {
      setSavingOption(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2
          size={16}
          className="animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Đang tải options…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Options
      </p>

      {options.map((option) => (
        <OptionRow
          key={option.id}
          option={option}
          productId={productId}
          onUpdated={(fields) =>
            setOptions((prev) =>
              prev.map((o) => (o.id === option.id ? { ...o, ...fields } : o))
            )
          }
          onDeleted={() =>
            setOptions((prev) => prev.filter((o) => o.id !== option.id))
          }
          onValueAdded={(value: ProductOptionValue) =>
            setOptions((prev) =>
              prev.map((o) =>
                o.id === option.id ? { ...o, values: [...o.values, value] } : o
              )
            )
          }
          onValueUpdated={(value: ProductOptionValue) =>
            setOptions((prev) =>
              prev.map((o) =>
                o.id === option.id
                  ? {
                      ...o,
                      values: o.values.map((v) =>
                        v.id === value.id ? value : v
                      ),
                    }
                  : o
              )
            )
          }
          onValueDeleted={(valueId: string) =>
            setOptions((prev) =>
              prev.map((o) =>
                o.id === option.id
                  ? { ...o, values: o.values.filter((v) => v.id !== valueId) }
                  : o
              )
            )
          }
        />
      ))}

      {/* Add option */}
      {addingOption ? (
        <div className="flex gap-2">
          <input
            ref={addOptionInputRef}
            value={optionDraft.name}
            onChange={(e) =>
              setOptionDraft((d) => ({ ...d, name: e.target.value }))
            }
            maxLength={50}
            disabled={savingOption}
            aria-label="Tên nhóm option mới"
            placeholder="Tên option *"
            className={`${inputCls} flex-1`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !savingOption) submitAddOption();
              if (e.key === "Escape" && !savingOption) {
                setAddingOption(false);
                setOptionDraft(emptyOption());
              }
            }}
          />
          <select
            value={optionDraft.type}
            onChange={(e) =>
              setOptionDraft((d) => ({
                ...d,
                type: e.target.value as "select" | "multi",
              }))
            }
            disabled={savingOption}
            aria-label="Kiểu chọn"
            className={`${inputCls} w-28 bg-background`}
          >
            <option value="select">Chọn 1</option>
            <option value="multi">Nhiều</option>
          </select>
          <button
            type="button"
            onClick={submitAddOption}
            disabled={savingOption || !optionDraft.name.trim()}
            aria-label="Thêm nhóm option"
            className="min-h-[44px] rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
          >
            {savingOption ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              "Thêm"
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingOption(false);
              setOptionDraft(emptyOption());
            }}
            disabled={savingOption}
            aria-label="Hủy thêm option"
            className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border disabled:opacity-50"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingOption(true)}
          aria-label="Thêm nhóm option mới"
          className="flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          <Plus size={14} aria-hidden="true" /> Thêm nhóm option
        </button>
      )}
    </div>
  );
}
